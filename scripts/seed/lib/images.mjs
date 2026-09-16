import sharp from 'sharp';

// Flatten transparent logos on white and box them, so the sharp->jpeg pipeline
// on the API does not turn transparency into black.
export async function logoToJpeg(buffer) {
	return sharp(buffer)
		.resize({ width: 400, height: 240, fit: 'contain', background: '#ffffff' })
		.flatten({ background: '#ffffff' })
		.jpeg({ quality: 90 })
		.toBuffer();
}

// Fallback wordmark when Commons has no usable logo.
export async function wordmark(text) {
	const size = text.length > 9 ? 40 : 54;
	const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="240">
	<rect width="400" height="240" fill="#ffffff"/>
	<text x="200" y="135" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="${size}" font-weight="700" letter-spacing="2" fill="#1a1a1a">${text.toUpperCase()}</text>
	</svg>`;
	return sharp(Buffer.from(svg)).jpeg({ quality: 90 }).toBuffer();
}

export const isValidImage = async (buffer) => {
	try {
		const meta = await sharp(buffer).metadata();
		return (meta.width || 0) >= 600 && (meta.height || 0) >= 300;
	} catch {
		return false;
	}
};
