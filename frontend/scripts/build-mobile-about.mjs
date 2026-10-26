// Generate the mobile content module from the web copy; the default is a workspace staging file.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repository = fileURLToPath(new URL('../../', import.meta.url));
const content = JSON.parse(fs.readFileSync(path.join(repository, 'frontend/src/content/aboutEduPath.json'), 'utf8'));
const output = process.argv[2] ? path.resolve(process.argv[2]) : path.join(repository, 'storage/about-redesign/about_content.dart');
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, '// Generated from frontend/src/content/aboutEduPath.json. Keep both clients in sync.\nconst Map<String, dynamic> aboutContent = '
  + JSON.stringify(content, null, 2).replaceAll('$', '\\$') + ';\n');
console.log(`Generated mobile About content: ${output}`);
