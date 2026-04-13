/* global JSZip */

const dropZone = document.querySelector('#upload-area');
const templateEntry = document.querySelector("#template-asset-listing")
const dropEventsArr = ["dragenter", "dragover"]
const WEBP_QUALITY = 0.85

dropEventsArr.forEach(evt => {
	dropZone.addEventListener(evt, e => e.preventDefault());
});

dropZone.addEventListener("dragenter", () => {
	dropZone.classList.add('drag-active');
})

dropZone.addEventListener('drop', e => {
	e.preventDefault();
	dropZone.classList.remove('drag-active');
	const files = Array.from(e.dataTransfer.files);
	handleFiles(files);
});

dropZone.addEventListener('dragleave', e => {
	if (!e.relatedTarget || !dropZone.contains(e.relatedTarget)) {
		dropZone.classList.remove('drag-active');
	}
});

function handleFiles(files) {
	document.querySelector("#processing-floor").classList.remove("hidden");
	files.forEach((file) => {
		if (file.name.toLowerCase().endsWith('.resonitepackage')) {
			file.id = `r${crypto.getRandomValues(new Uint32Array(1))}`;
			ui.addListing(file);
		} else {
			// TODO: Better error?
			alert(`Invalid file type: ${file.name}. Expected .ResonitePackage`);
		}
	})
}

function detectMime(buf) {
	const b = buf;
	if (b[0] === 0xff && b[1] === 0xd8) return "image/jpeg";
	if (b[0] === 0x89 && b[1] === 0x50) return "image/png";
	if (b[0] === 0x47 && b[1] === 0x49) return "image/gif";
	if (b[0] === 0x42 && b[1] === 0x4d) return "image/bmp";
	if (b[0] === 0x52 && b[1] === 0x49) return "image/webp";
	return null;
}

async function optimizeAsset(file, settings, listingElement) {
	// TODO: Error checks for missing params
	const fileZip = await JSZip.loadAsync(file)
	const compressedZip = new JSZip();
	const totalAssets = Object.keys(fileZip.files).length
	let processedAssets = 0;

	for (const asset of Object.keys(fileZip.files)) {
		const entry = fileZip.files[asset];
		let blob = await entry.async("blob");

		const head = new Uint8Array(await blob.slice(0, 512).arrayBuffer());
		const mime = detectMime(head);
		const isMimeImageAndNotWebp = mime && mime.startsWith("image/") && mime !== "image/webp";

		if (entry.dir) {
			compressedZip.folder(entry.name);
			console.log(`Created new folder: '${entry.name}'`);
			continue;
		}

		if (settings.includes("webp") && isMimeImageAndNotWebp) {
			const webp = await compressAsWebP(blob, WEBP_QUALITY);

			if (!webp) {
				console.error(`${entry.name} had an error compressing. Using original file.`);
				continue;
			}

			let changedFile = { name: entry.name, originalSize: entry._data.uncompressedSize, newSize: webp.size };

			if (changedFile.originalSize > changedFile.newSize) {
				console.log(`${changedFile.name} compressed successfully (${sizeToMebibyte(changedFile.originalSize)} to ${sizeToMebibyte(changedFile.newSize)}), writing.`);
				blob = webp
			} else {
				console.log(`${changedFile.name} did not compress well, using original file.`);
			}
		}

		processedAssets++;
		ui.updateListingProcess(listingElement, totalAssets, processedAssets);
		compressedZip.file(entry.name, blob);
	}

	const compressedZipContent = await compressedZip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 9 } });
	const compressedZipUrl = URL.createObjectURL(compressedZipContent);

	listingElement.querySelector(".processing").classList.add("hidden")
	listingElement.querySelector(".download").classList.remove("hidden")

	const downloadButton = listingElement.querySelector(".download");
	downloadButton.href = compressedZipUrl;
	downloadButton.download = file.name.replace(".resonitepackage", "_compressed.resonitepackage");
}

// TODO: Is there a way to do this without using a canvas element?
function compressAsWebP(blob, quality = 0.9) {
	return new Promise((res) => {
		try {
			const img = new Image();

			img.src = URL.createObjectURL(blob);

			img.onload = () => {
				const c = document.createElement("canvas");
				c.width = img.naturalWidth;
				c.height = img.naturalHeight;
				c.getContext("2d").drawImage(img, 0, 0);
				c.toBlob((b) => res(b), "image/webp", quality);
			};
		} catch (e) {
			console.log(e)
			res(null);
		}
	});
}

function sizeToMebibyte(value, includeLabel = true) {
	const MEBIBYTE_SIZE = 1024 * 1024;
	return String((value / MEBIBYTE_SIZE).toFixed(2)) + (includeLabel ? " MiB" : "");
}

const ui = {
	addListing: (file) => {
		const clone = document.importNode(templateEntry.content, true);
		clone.querySelector(".asset-listing").id = file.id;

		// TODO: Improve file name trimming.
		clone.querySelector('.asset-title').innerText = file.name.replace(".resonitepackage", "");
		const allOptionsElements = clone.querySelectorAll(".toggle-button");
		const webpCheckbox = clone.querySelector('[data-setting="webp"]');

		const startBtn = clone.querySelector('.start');
		const loadingIndicator = clone.querySelector(".processing");

		startBtn.addEventListener('click', async () => {
			let settings = [];

			if (webpCheckbox.checked) {
				settings.push("webp");
			}

			allOptionsElements.forEach((elem) => {
				elem.classList.add("hidden");
			})

			startBtn.classList.add("hidden");
			loadingIndicator.classList.remove("hidden");

			await optimizeAsset(file, settings, document.querySelector(`#${file.id}`));
		});

		document.querySelector('#processing-floor').appendChild(clone);
	},
	updateListingProcess: (elem, totalAssets, processedAssets) => {
		const percent = (processedAssets / totalAssets) * 100;
		elem.querySelector(".progress-bar").style = `width: ${String(percent)}%`;
	}
}

