let currentPageStep = 0;

let inputFile = {
	size: 0,
	name: "",
	file: null,
};

let changedFilesList = [];

// Page steps
function nextPageStep() {
	currentPageStep++;
	showPageStep(currentPageStep);
}

function resetPageStep() {
	currentPageStep = 0;
	showPageStep(currentPageStep);
}

function showPageStep(index) {
	const allPages = document.querySelectorAll(".left-step");

	allPages.forEach((page) => {
		page.classList.add("hidden");
	});

	allPages[index].classList.remove("hidden");
}

// Page controller
document.querySelector("#resonite-package-file-input").addEventListener("change", async (e) => {
	const file = e.target.files[0];
	if (!file) return;

	inputFile.size = file.size;
	inputFile.name = file.name;
	inputFile.file = await JSZip.loadAsync(file);
	nextPageStep();
});

document.querySelector("#start-compression").addEventListener("click", async () => {
	startCompression();
});

const webpQualitySlider = document.querySelector("#webp-quality-range");
const webpQualitySliderValue = document.querySelector("#webp-quality-display");
webpQualitySliderValue.textContent = webpQualitySlider.value;
webpQualitySlider.addEventListener("input", () => (webpQualitySliderValue.textContent = parseFloat(webpQualitySlider.value).toFixed(2)));

async function startCompression() {
	if (!inputFile.file) return;
	document.querySelector("#start-compression").disabled = true;

	const isWebPConversionEnabled = document.querySelector("#webp-compression-enabled").checked;
	const webpQuality = document.querySelector("#webp-quality-range").value;

	const compressedZip = new JSZip();

	for (const assetEntry of Object.keys(inputFile.file.files)) {
		const entry = inputFile.file.files[assetEntry];

		if (entry.dir) {
			compressedZip.folder(entry.name);
			console.log(`Created new folder: '${entry.name}'`);
			continue;
		}

		const blob = await entry.async("blob");

		if (isWebPConversionEnabled) {
			const head = new Uint8Array(await blob.slice(0, 512).arrayBuffer());
			const mime = detectMime(head);

			const isMimeImageAndNotWebp = mime && mime.startsWith("image/") && mime !== "image/webp";

			if (isMimeImageAndNotWebp) {
				const webp = await toWebP(blob, webpQuality);

				let changedFile = { name: entry.name, originalSize: entry._data.uncompressedSize, newSize: webp.size };

				if (changedFile.originalSize > changedFile.newSize) {
					console.log(`${changedFile.name} compressed successfully, writing.`);
					compressedZip.file(entry.name, webp);
					changedFilesList.push(changedFile);
					addLog("webpConversion", changedFile);
				} else {
					console.log(`${changedFile.name} did not compress well, using original file.`);
					compressedZip.file(entry.name, blob);
				}
				continue;
			}
		}

		compressedZip.file(entry.name, blob);
	}

	const compressedZipContent = await compressedZip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 9 } });
	const compressedZipUrl = URL.createObjectURL(compressedZipContent);

	const downloadButton = document.querySelector("#download-compressed-zip");
	downloadButton.href = compressedZipUrl;
	downloadButton.download = inputFile.name.replace(".resonitepackage", "_compressed.resonitepackage");

	document.querySelector("#file-stat-original-size").innerText = sizeToMebibyte(inputFile.size);
	document.querySelector("#file-stat-compressed-size").innerText = sizeToMebibyte(compressedZipContent.size);
	document.querySelector("#file-stat-space-saved").innerText = sizeToMebibyte(inputFile.size - compressedZipContent.size);
	document.querySelector("#file-stat-files-changed").innerText = changedFilesList.length;

	alert("Finished!");

	nextPageStep();
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

function toWebP(blob, quality = 0.85) {
	return new Promise((res) => {
		const img = new Image();

		img.src = URL.createObjectURL(blob);

		img.onload = () => {
			const c = document.createElement("canvas");
			c.width = img.naturalWidth;
			c.height = img.naturalHeight;
			c.getContext("2d").drawImage(img, 0, 0);
			c.toBlob((b) => res(b), "image/webp", quality);
		};
	});
}

function addLog(type, entryData) {
	if (type === "webpConversion") {
		const templateElement = document.querySelector("#log-entry-webp");
		let logEntry = templateElement.content.cloneNode(true);
		logEntry.querySelector(".title").innerText = entryData.name;
		logEntry.querySelector("[data-type=original-size]").innerText = "Original: " + sizeToMebibyte(entryData.originalSize);
		logEntry.querySelector("[data-type=new-size]").innerText = "New: " + sizeToMebibyte(entryData.newSize);
		logEntry.querySelector("[data-type=savings]").innerText = "Saved: " + sizeToMebibyte(entryData.originalSize - entryData.newSize);
		document.querySelector(".log").appendChild(logEntry);
		return;
	}
}
