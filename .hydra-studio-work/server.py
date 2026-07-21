from __future__ import annotations

import argparse
import mimetypes
import os
import shutil
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


class NoCacheHandler(SimpleHTTPRequestHandler):
    _byte_range: tuple[int, int] | None = None

    def end_headers(self) -> None:
        self.send_header("Cache-Control", "no-store")
        self.send_header("Accept-Ranges", "bytes")
        super().end_headers()

    def send_head(self):
        range_header = self.headers.get("Range")
        if not range_header or not range_header.startswith("bytes="):
            self._byte_range = None
            return super().send_head()

        path = self.translate_path(self.path)
        if os.path.isdir(path):
            return super().send_head()
        try:
            source = open(path, "rb")
        except OSError:
            self.send_error(404, "File not found")
            return None

        size = os.fstat(source.fileno()).st_size
        requested = range_header.removeprefix("bytes=").split(",", 1)[0]
        start_text, end_text = requested.split("-", 1)
        start = int(start_text) if start_text else 0
        end = int(end_text) if end_text else size - 1
        if start >= size or start > end:
            source.close()
            self.send_response(416)
            self.send_header("Content-Range", f"bytes */{size}")
            self.end_headers()
            return None

        end = min(end, size - 1)
        self._byte_range = (start, end)
        self.send_response(206)
        self.send_header("Content-Type", self.guess_type(path))
        self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
        self.send_header("Content-Length", str(end - start + 1))
        self.send_header("Last-Modified", self.date_time_string(os.fstat(source.fileno()).st_mtime))
        self.end_headers()
        source.seek(start)
        return source

    def copyfile(self, source, outputfile) -> None:
        if self._byte_range is None:
            shutil.copyfileobj(source, outputfile)
            return
        remaining = self._byte_range[1] - self._byte_range[0] + 1
        while remaining:
            chunk = source.read(min(64 * 1024, remaining))
            if not chunk:
                break
            outputfile.write(chunk)
            remaining -= len(chunk)


def main() -> None:
    parser = argparse.ArgumentParser(description="Hydra Boss-room placement console")
    parser.add_argument("--port", type=int, default=5198)
    args = parser.parse_args()
    root = Path(__file__).resolve().parent
    mimetypes.add_type("video/webm", ".webm")
    handler = lambda *a, **kw: NoCacheHandler(*a, directory=str(root), **kw)
    server = ThreadingHTTPServer(("127.0.0.1", args.port), handler)
    print(f"Hydra placement console: http://127.0.0.1:{args.port}/", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
