let zipData;
let changedFiles = [];
let zipOriginalSize = 0;
let zipNewSize = 0;
let packageName = "";

document.getElementById("zipFile").addEventListener("change", async (e) => {
	const file = e.target.files[0];
	if (!file) return;
	zipData = await JSZip.loadAsync(file);
	zipOriginalSize = file.size;
	document.querySelector(`#original-size-value`).innerText = toMebibyte(file.size, true);
	packageName = file.name;
	document.getElementById("goBtn").disabled = false;
});

document.getElementById("goBtn").addEventListener("click", async () => {
	if (!zipData) return;
	const newZip = new JSZip();

	for (const objectEntry of Object.keys(zipData.files)) {
		const name = zipData.files[objectEntry].name;
		const entry = zipData.files[objectEntry];

		if (entry.dir) {
			newZip.folder(name);
			continue;
		}

		const blob = await entry.async("blob");
		const head = new Uint8Array(await blob.slice(0, 512).arrayBuffer());
		const mime = detectMime(head);

		if (mime && mime.startsWith("image/") && mime !== "image/webp" && document.querySelector("#webp-convert-value").checked) {
			const webp = await toWebP(blob);
			newZip.file(name, webp);
			let changedFile = { name, originalSize: entry._data.uncompressedSize, newSize: webp.size };
			if (changedFile.originalSize < changedFile.newSize) {
				addChangedFile(changedFile, false);
				continue;
			}
			addChangedFile(changedFile, true);
			continue;
		}

		newZip.file(name, blob);
	}

	const content = await newZip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 9 } });
	const url = URL.createObjectURL(content);
	const a = document.getElementById("downLink");
	a.href = url;
	a.download = packageName.replace(".resonitepackage", "_compressed.resonitepackage");
	a.classList.remove("hidden");
	zipNewSize = content.size;

	document.querySelector(`#optimized-size-value`).innerText = toMebibyte(zipNewSize, true);
});

function detectMime(buf) {
	const b = buf;
	if (b[0] === 0xff && b[1] === 0xd8) return "image/jpeg";
	if (b[0] === 0x89 && b[1] === 0x50) return "image/png";
	if (b[0] === 0x47 && b[1] === 0x49) return "image/gif";
	if (b[0] === 0x42 && b[1] === 0x4d) return "image/bmp";
	if (b[0] === 0x52 && b[1] === 0x49) return "image/webp";
	return null;
}

function toWebP(blob) {
	return new Promise((res) => {
		const img = new Image();
		img.src = URL.createObjectURL(blob);
		img.onload = () => {
			const c = document.createElement("canvas");
			c.width = img.naturalWidth;
			c.height = img.naturalHeight;
			c.getContext("2d").drawImage(img, 0, 0);
			c.toBlob((b) => res(b), "image/webp", document.querySelector("#webp-quality").value);
		};
	});
}

function addChangedFile(changedFileObject, replaced) {
	if (!replaced) return;
	changedFiles.push(changedFileObject);
	const htmlToAppend = `<div class="entry">
		<div class="entry-title">${changedFileObject.name}</div>
		<div class="entry-metadata">
			<span class="entry-size">Original Size: <span class="entry-size-value">${toMebibyte(changedFileObject.originalSize, true)}</span></span>
			<span class="entry-size">New Size: <span class="entry-size-value">${toMebibyte(changedFileObject.newSize, true)}</span></span>
			<span class="entry-size entry-size-difference">Difference: <span class="entry-size-value">${toMebibyte(changedFileObject.originalSize - changedFileObject.newSize, true)}</span></span>
		</div>
	</div>`;

	document.querySelector("#fileList").insertAdjacentHTML("beforeend", htmlToAppend);
}

function toMebibyte(value, includeLabel) {
	const MEBIBYTE_SIZE = 1024 ^ 2;
	return String((value / (MEBIBYTE_SIZE * 1000)).toFixed(2)) + (includeLabel ? " MiB" : "");
}

const webpQualitySlider = document.querySelector("#webp-quality");
const webpQualitySliderValue = document.querySelector("#webp-quality-value");
webpQualitySliderValue.textContent = webpQualitySlider.value;
webpQualitySlider.addEventListener("input", () => (webpQualitySliderValue.textContent = webpQualitySlider.value));
