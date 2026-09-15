import { BadRequestException, Logger } from '@nestjs/common';
import { FileUpload } from 'graphql-upload';
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import type { Sharp, SharpOptions } from 'sharp';
// sharp ships ESM typings (`export default`) but its CJS build does `module.exports = Sharp`
// with no `.default`, so a default import compiles to `sharp_1.default(...)` and crashes
// at runtime. Require it directly and type the callable ourselves.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const sharp: (input?: Buffer, options?: SharpOptions) => Sharp = require('sharp');
import { Message } from './enums/common.enum';
import { uploadTargets, UploadTarget, validMimeTypes } from './config';

const logger = new Logger('Upload');

const IMAGE_MAX_WIDTH = 1400;
const IMAGE_JPEG_QUALITY = 80;
const AVATAR_MAX_WIDTH = 600;
const MODEL_MAX_BYTES = 25 * 1024 * 1024;

export const assertUploadTarget = (target: string): UploadTarget => {
	if (!uploadTargets.includes(target as UploadTarget)) throw new BadRequestException(Message.UPLOAD_FAILED);
	return target as UploadTarget;
};

const readStreamToBuffer = (stream: NodeJS.ReadableStream, maxBytes: number): Promise<Buffer> =>
	new Promise((resolve, reject) => {
		const chunks: Buffer[] = [];
		let total = 0;
		stream.on('data', (chunk: Buffer) => {
			total += chunk.length;
			if (total > maxBytes) {
				reject(new BadRequestException(Message.UPLOAD_FAILED));
				(stream as T).destroy?.();
				return;
			}
			chunks.push(chunk);
		});
		stream.on('end', () => resolve(Buffer.concat(chunks)));
		stream.on('error', reject);
	});

type T = { [key: string]: any };

// Every uploaded image is decoded and re-encoded by sharp: a file that is not
// really an image cannot survive this, EXIF (incl. GPS) is dropped, orientation
// is baked in, and large phone photos are downscaled to a web-friendly size.
export const saveImageUpload = async (file: FileUpload, target: string): Promise<string> => {
	const safeTarget = assertUploadTarget(target);
	const { filename, mimetype, createReadStream } = file;
	if (!filename) throw new BadRequestException(Message.UPLOAD_FAILED);
	if (!validMimeTypes.includes(mimetype)) throw new BadRequestException(Message.PROVIDE_ALLOWED_FORMAT);

	const input = await readStreamToBuffer(createReadStream(), 15 * 1024 * 1024);
	const width = safeTarget === 'member' ? AVATAR_MAX_WIDTH : IMAGE_MAX_WIDTH;
	let output: Buffer;
	try {
		output = await sharp(input, { failOn: 'error' })
			.rotate()
			.resize({ width, withoutEnlargement: true })
			.jpeg({ quality: IMAGE_JPEG_QUALITY, mozjpeg: true })
			.toBuffer();
	} catch (err: any) {
		logger.warn(`Rejected upload "${filename}": ${err?.message}`);
		throw new BadRequestException(Message.PROVIDE_ALLOWED_FORMAT);
	}

	const relative = path.join('uploads', safeTarget, `${uuidv4()}.jpg`);
	await fs.promises.writeFile(path.resolve(relative), output);
	return relative.split(path.sep).join('/');
};

// GLB (binary glTF) upload for 3D/AR: magic bytes "glTF" + size cap, stored as-is.
export const saveModelUpload = async (file: FileUpload): Promise<string> => {
	const { filename, createReadStream } = file;
	if (!filename || !filename.toLowerCase().endsWith('.glb')) throw new BadRequestException(Message.UPLOAD_FAILED);
	const input = await readStreamToBuffer(createReadStream(), MODEL_MAX_BYTES);
	if (input.length < 12 || input.toString('ascii', 0, 4) !== 'glTF')
		throw new BadRequestException(Message.UPLOAD_FAILED);
	const relative = path.join('uploads', 'model', `${uuidv4()}.glb`);
	await fs.promises.writeFile(path.resolve(relative), input);
	return relative.split(path.sep).join('/');
};
