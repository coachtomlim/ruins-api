#!/usr/bin/env python3
"""HostGator-safe release ZIP writer / auditor (Python standard library only).

002E9G: the previous packager used PowerShell Compress-Archive, which on Windows wrote member names with
backslashes (flare-p0\\src\\core\\flare.mjs). Windows extractors tolerate that; cPanel/Linux extractors do not and
silently dropped nested files. This tool gives the packager explicit control of every member name:

  build   <stage-dir> <zip> <files.json>   write the ZIP: explicit parent directory entries (ending '/'), then the
                                           listed files, every name POSIX ('/') and validated before and after writing
  audit   <zip>                            print JSON counts of the RAW central-directory names (entries, files,
                                           directories, backslash, unsafe, duplicates)
  extract <zip> <dest-dir>                 standards-style extraction with zipfile (a stand-in for a Linux extractor)

Exit status is non-zero if any unsafe name is found.
"""
import hashlib
import json
import os
import re
import sys
import zipfile

# Fixed timestamp so identical inputs give byte-identical archives.
FIXED_TIME = (2026, 1, 1, 0, 0, 0)


def name_problems(name, is_dir):
    """Reasons a member name is not portable. Empty list = safe."""
    problems = []
    if '\\' in name:
        problems.append('backslash')
    if name.startswith('/'):
        problems.append('absolute')
    if re.match(r'^[A-Za-z]:', name):
        problems.append('drive-prefix')
    if '..' in name.split('/'):
        problems.append('dotdot')
    if '' in name.rstrip('/').split('/') and name != '':
        problems.append('empty-segment')
    if is_dir and not name.endswith('/'):
        problems.append('directory-without-slash')
    if not is_dir and name.endswith('/'):
        problems.append('file-with-slash')
    return problems


def read_central_directory(zip_path):
    """Parse the ZIP central directory by hand and return the RAW member names (bytes decoded as UTF-8/cp437).
    zipfile.ZipFile on Windows rewrites os.sep to '/' when it reads names, which would hide the very defect this
    tool exists to catch, so the audit and the extractor below never go through zipfile's name handling."""
    import struct
    with open(zip_path, 'rb') as f:
        data = f.read()
    eocd = data.rfind(b'PK')
    if eocd < 0:
        raise SystemExit('not a ZIP file (no end-of-central-directory record)')
    total, cd_size, cd_off = struct.unpack('<HII', data[eocd + 10:eocd + 20])
    entries, pos = [], cd_off
    for _ in range(total):
        if data[pos:pos + 4] != b'PK':
            raise SystemExit('corrupt central directory')
        (_v, _x, flags, method, _t, _d, crc, csize, usize, nlen, elen, clen, _disk, _ia, _ea, lho) = struct.unpack('<HHHHHHIIIHHHHHII', data[pos + 4:pos + 46])
        raw_name = data[pos + 46:pos + 46 + nlen]
        name = raw_name.decode('utf-8' if flags & 0x800 else 'cp437')
        entries.append({'name': name, 'method': method, 'csize': csize, 'usize': usize, 'crc': crc, 'offset': lho})
        pos += 46 + nlen + elen + clen
    return data, entries


def audit(zip_path):
    data, entries = read_central_directory(zip_path)
    names = [e['name'] for e in entries]
    dirs = [n for n in names if n.endswith('/')]
    files = [n for n in names if not n.endswith('/')]
    unsafe = []
    for n in names:
        p = name_problems(n, n.endswith('/'))
        if p:
            unsafe.append({'name': n, 'problems': p})
    seen, dup = set(), []
    for n in names:
        if n in seen:
            dup.append(n)
        seen.add(n)
    return {
        'zip': os.path.basename(zip_path),
        'sha256': hashlib.sha256(open(zip_path, 'rb').read()).hexdigest(),
        'bytes': os.path.getsize(zip_path),
        'totalEntries': len(names),
        'fileEntries': len(files),
        'directoryEntries': len(dirs),
        'backslashEntries': sum(1 for n in names if '\\' in n),
        'unsafeEntries': len(unsafe),
        'duplicateEntries': len(dup),
        'unsafe': unsafe,
        'duplicates': dup,
        'files': sorted(files),
        'directories': sorted(dirs),
    }


def build(stage, zip_path, rel_files):
    # Every name is normalised ONLY here, while the archive is constructed.
    members = [r.replace('\\', '/') for r in rel_files]
    for m in members:
        bad = name_problems(m, False)
        if bad:
            raise SystemExit('refusing unsafe file name %r: %s' % (m, ','.join(bad)))
    if len(set(members)) != len(members):
        raise SystemExit('duplicate file names in the file list')
    dirs = []
    seen = set()
    for m in members:
        parts = m.split('/')[:-1]
        for k in range(1, len(parts) + 1):
            d = '/'.join(parts[:k]) + '/'
            if d not in seen:
                seen.add(d)
                dirs.append(d)
    dirs.sort()
    if os.path.exists(zip_path):
        os.remove(zip_path)
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        for d in dirs:
            zi = zipfile.ZipInfo(d, FIXED_TIME)
            zi.create_system = 3  # Unix
            zi.external_attr = (0o40755 << 16) | 0x10
            z.writestr(zi, b'')
        for m in sorted(members):
            with open(os.path.join(stage, *m.split('/')), 'rb') as f:
                data = f.read()
            zi = zipfile.ZipInfo(m, FIXED_TIME)
            zi.create_system = 3
            zi.compress_type = zipfile.ZIP_DEFLATED
            zi.external_attr = 0o100644 << 16
            z.writestr(zi, data)
    # The finished archive must pass the same contract; nothing is rewritten after the fact.
    report = audit(zip_path)
    if report['unsafeEntries'] or report['duplicateEntries'] or report['backslashEntries']:
        raise SystemExit('built archive failed the path-safety contract: %s' % json.dumps(report['unsafe']))
    if report['fileEntries'] != len(members):
        raise SystemExit('file entry count %d != %d' % (report['fileEntries'], len(members)))
    return report


def extract(zip_path, dest):
    """Standards-style extraction by raw member name (what a Linux/cPanel extractor does): a member called
    'a\b.mjs' becomes ONE file with a backslash in its name, so a bad archive yields missing manifest paths."""
    import zlib
    import struct
    data, entries = read_central_directory(zip_path)
    for e in entries:
        if name_problems(e['name'], e['name'].endswith('/')):
            raise SystemExit('unsafe member %r' % e['name'])
    os.makedirs(dest, exist_ok=True)
    for e in entries:
        target = os.path.join(dest, *[seg for seg in e['name'].split('/') if seg])
        if e['name'].endswith('/'):
            os.makedirs(target, exist_ok=True)
            continue
        lho = e['offset']
        nlen, elen = struct.unpack('<HH', data[lho + 26:lho + 30])
        start = lho + 30 + nlen + elen
        blob = data[start:start + e['csize']]
        if e['method'] == 0:
            payload = blob
        elif e['method'] == 8:
            payload = zlib.decompressobj(-15).decompress(blob)
        else:
            raise SystemExit('unsupported compression method %d' % e['method'])
        if len(payload) != e['usize'] or (zlib.crc32(payload) & 0xffffffff) != e['crc']:
            raise SystemExit('corrupt member %r' % e['name'])
        os.makedirs(os.path.dirname(target), exist_ok=True)
        with open(target, 'wb') as out:
            out.write(payload)


def main(argv):
    if len(argv) < 2:
        raise SystemExit(__doc__)
    cmd = argv[1]
    if cmd == 'build':
        stage, zip_path, files_json = argv[2:5]
        with open(files_json, encoding='utf8') as f:
            rel_files = json.load(f)
        r = build(stage, zip_path, rel_files)
        print(json.dumps({k: r[k] for k in ('zip', 'totalEntries', 'fileEntries', 'directoryEntries')}))
    elif cmd == 'audit':
        r = audit(argv[2])
        print(json.dumps(r))
        if r['unsafeEntries'] or r['duplicateEntries'] or r['backslashEntries']:
            sys.exit(2)
    elif cmd == 'extract':
        extract(argv[2], argv[3])
    else:
        raise SystemExit('unknown command ' + cmd)


if __name__ == '__main__':
    main(sys.argv)
