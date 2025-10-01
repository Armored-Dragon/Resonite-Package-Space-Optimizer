# Resonite-Package-Space-Optimizer

[Use the tool here!](https://armored-dragon.github.io/Resonite-Package-Space-Optimizer/index)

This is a browser utility for optimizing Resonite Packages.

## Instructions

Firstly. You need a Resonite Package. You can export your own items or get one from another place.
See [this wiki](https://wiki.resonite.com/ResonitePackage#How_to_export) for instructions on how to export your item.

Once you have your Resonite Package. Navigate to [this website](https://armored-dragon.github.io/Resonite-Package-Space-Optimizer/index) (You are on the repository for this website right now) and select your Resonite Package.

__<u>Please keep this original Resonite Package safe.</u>__
In the event something goes wrong, you will want to keep this as a backup of your data.

Please keep in mind that all data is locally handled. Your Resonite Package will not be uploaded to any server. (Because there isn't one!). This website utilizes [JSZip](https://stuk.github.io/jszip/) for handling Zip files in the browser.

After selecting your Resonite Package, you will be presented with options on optimizing your asset(s).

Here are the currently implemented optimizations:

1. Images to WebP.
 - Converts all images to a space efficient format, WebP.

After making your selection, you start the conversion by clicking the "Compress" button.

Once the process is complete, you will be alerted and offered a download link to retrieve your newly created Zip file. The downloaded zip file will automatically append "_compressed" to the end of the file to help you keep track of your files.

Finally, import your newly compressed Resonite Package to make sure the package works correctly.

## Results

Personally, I have compressed avatars from ~150 MiB down to only 50 MiB. Other avatars and items I have easily squashed down to around half of their original size. Please keep in mind that each item is different and some items may not compress at all, while others will see a extremely large reduction in file size.