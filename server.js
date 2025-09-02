const http = require('http');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const os = require('os');
require('colors');

const PORT = 3000;

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const MIME_TYPES = {
    '.txt': 'text/plain; charset=utf-8',
    '.log': 'text/plain; charset=utf-8',
    '.md': 'text/plain; charset=utf-8',
    '.bat': 'text/plain; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.htm': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.bmp': 'image/bmp',
    '.svg': 'image/svg+xml',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
    '.flac': 'audio/flac',
    '.m4a': 'audio/mp4',
    '.mp4': 'video/mp4',
    '.mov': 'video/quicktime',
    '.avi': 'video/x-msvideo',
    '.mkv': 'video/x-matroska',
    '.webm': 'video/webm',
    '.flv': 'video/x-flv'
};

rl.question('Enter the directory you want to serve: '.cyan, async inputDir => {

    const ROOT = path.resolve(inputDir);

    if ( !fs.existsSync(ROOT) || !fs.statSync(ROOT).isDirectory() ) {

        console.error('❌ Invalid directory path'.red.bold);
        rl.close();
        process.exit(1);

    }

    const truncate = (name, max = 64) => name.length > max ? name.slice(0, max - 3) + '...' : name;

    console.clear()

    const server = http.createServer((req, res) => {

        const rawUrl = req.url.split('?')[0];
        let cleanUrl = decodeURIComponent(rawUrl);

        if (!cleanUrl.startsWith('/')) cleanUrl = '/' + cleanUrl;
        if (!cleanUrl.startsWith('/__assets__/')) {
            console.log(`[INFO] [${new Date().toLocaleString().gray}] ${req.method.green} ${cleanUrl.yellow}`);
        }

        if (cleanUrl.startsWith('/__assets__/')) {

            const rel = cleanUrl.replace('/__assets__/', '');
            const assetPath = path.join(__dirname, 'public', rel);

            if (!assetPath.startsWith(path.join(__dirname, 'public'))) {
                res.writeHead(403); return res.end('Forbidden');
            }

            return fs.stat(assetPath, (e, st) => {
                if (e || !st.isFile()) { res.writeHead(404); return res.end('Not found'); }
                const ext = path.extname(assetPath).toLowerCase();
                res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
                fs.createReadStream(assetPath).pipe(res);
            });

        }

        if (cleanUrl.startsWith('/__download_folder__/')) {

            const rel = cleanUrl.replace('/__download_folder__/', '');
            const folderPath = path.join(ROOT, rel);

            if (!folderPath.startsWith(ROOT) || !fs.existsSync(folderPath) || !fs.statSync(folderPath).isDirectory()) {
                res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
                return res.end('Folder not found');
            }

            const archiver = require('archiver');

            res.writeHead(200, {
                'Content-Type': 'application/zip',
                'Content-Disposition': `attachment; filename="${path.basename(folderPath)}.zip"`
            });

            const archive = archiver('zip', { zlib: { level: 9 } });
            archive.pipe(res);
            archive.directory(folderPath, false).finalize();
            return;

        }

        const fsPath = path.join(ROOT, cleanUrl);

        if (!fsPath.startsWith(ROOT)) {

            res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
            return res.end('Access denied');

        }

        fs.stat(fsPath, (err, stats) => {

            if (err) {
                res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
                return res.end('Not found');
            }

            if (!stats.isDirectory()) {
                const ext = path.extname(fsPath).toLowerCase();
                res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
                return fs.createReadStream(fsPath).pipe(res);
            }

            fs.readdir(fsPath, { withFileTypes: true }, (e2, entries) => {

                if (e2) {
                    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
                    return res.end('Server error');
                }

                entries.sort((a, b) => (a.isDirectory() === b.isDirectory() ? a.name.localeCompare(b.name) : a.isDirectory() ? -1 : 1));

                let parentDir = path.dirname(cleanUrl);
                if (!parentDir.endsWith('/')) parentDir += '/';

                const rows = [];
                if (cleanUrl !== '/') {
                    rows.push(`<tr class="file-row"><td><a class="file-link" href="${parentDir}">..</a></td><td class="type"><span class="type-label"><span>📁</span><span>Parent</span></span></td></tr>`);
                }

                for (const entry of entries) {

                    const slash = cleanUrl.endsWith('/') ? '' : '/';
                    const href = path.join(cleanUrl, slash + entry.name).replace(/\\/g, '/');
                    const display = truncate(decodeURIComponent(entry.name));
                    const isDir = entry.isDirectory();
                    const icon = isDir ? '📁' : '📄';
                    const label = isDir ? 'Folder' : 'File';
                    const folderDownloadUrl = `/__download_folder__/${encodeURIComponent(path.join(cleanUrl.replace(/^\//, ''), entry.name))}`;
                    
                    const downloadBtn = isDir
                        ? `<button class="download-btn" onclick="event.stopPropagation(); window.location='${folderDownloadUrl}'" title="Download Folder as Zip">⬇️</button>`
                        : `<button class="download-btn" onclick="event.stopPropagation(); window.location='${href}'" title="Download">⬇️</button>`;

                    rows.push(
                        `<tr class="file-row">` +
                            `<td><a class="file-link" href="${href}${isDir ? '/' : ''}">${display}</a></td>` +
                            `<td class="type">` +
                                `<span class="type-label">` +
                                    `<span>${icon}</span>` +
                                    `<span>${label}</span>` +
                                `</span>` +
                                `${downloadBtn}` +
                            `</td>` +
                        `</tr>`
                    );

                }

                const template = fs.readFileSync(path.join(__dirname, 'templates', 'index.html'), 'utf-8');

                const html = template
                    .replace(/{{CLEAN_URL}}/g, cleanUrl)
                    .replace('{{ROWS_HTML}}', rows.join('\n'));

                res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end(html);

            });
        });

    });

    let deviceIP = 'unknown';

    function getLanIP() {
        
        const nets = os.networkInterfaces();

        for (const name of Object.keys(nets)) {
            for (const n of nets[name]) {
                if (n && n.family === 'IPv4' && !n.internal) {
                    const addr = n.address;
                    if (/^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(addr)) return addr;
                }
            }
        }

        return 'unknown';

    }

    deviceIP = getLanIP();

    server.listen(PORT, '0.0.0.0', () => {
        console.log()
        console.log(`[✅] Server running!`.green.bold);
        console.log(`[✅] Local   - http://localhost:${PORT}/`.green);
        console.log(`[✅] Network - http://${deviceIP}:${PORT}/`.green);
        console.log()
        console.log(`[📂] Serving files from: ${truncate(inputDir).cyan}`);
    });

    rl.close();

});
