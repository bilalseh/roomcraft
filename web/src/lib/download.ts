/** Saves a file the browser built, under the given name. */
export function download(contents: Blob, filename: string): void {
  const url = URL.createObjectURL(contents);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  // Give the browser a moment to start the download before letting go of the data.
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}

/** "Sunny living room" becomes "sunny-living-room", for file names. */
export function slug(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "room"
  );
}
