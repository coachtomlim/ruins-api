"""Test helper: hand-build a stored ZIP whose central directory carries deliberately unsafe member names verbatim
(zipfile would rewrite os.sep on Windows). Usage: make_unsafe_zip.py <out.zip>"""
import struct
import sys
import zlib

names = ['flare-p0\\src\\core\\flare.mjs', '/abs/x.mjs', 'C:/win/x.mjs', 'a/../b.mjs', 'dup.mjs', 'dup.mjs']
body = b'x'
crc = zlib.crc32(body) & 0xffffffff
out = b''
cd = b''
for n in names:
    nb = n.encode()
    off = len(out)
    out += struct.pack('<IHHHHHIIIHH', 0x04034b50, 20, 0, 0, 0, 0, crc, 1, 1, len(nb), 0) + nb + body
    cd += struct.pack('<IHHHHHHIIIHHHHHII', 0x02014b50, 20, 20, 0, 0, 0, 0, crc, 1, 1, len(nb), 0, 0, 0, 0, 0, off) + nb
eocd = struct.pack('<IHHHHIIH', 0x06054b50, 0, 0, len(names), len(names), len(cd), len(out), 0)
with open(sys.argv[1], 'wb') as f:
    f.write(out + cd + eocd)
