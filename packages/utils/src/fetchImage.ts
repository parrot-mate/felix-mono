export async function fetchImage(url: string) {
  const response = await fetch(url);
  const blob = await response.blob();

  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.readAsDataURL(blob);
    reader.onloadend = async function () {
      let base64data = reader.result as string;

      if (!base64data) {
        reject("Error while saveImage");
      }
      resolve(base64data);
    };

    reader.onerror = function () {
      reject("Error while saveImage");
    };
  });
}
