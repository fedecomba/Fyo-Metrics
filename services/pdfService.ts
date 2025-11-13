
// This is to inform TypeScript about the pdfjsLib global variable
declare const pdfjsLib: any;

/**
 * Extracts all text content from a given PDF file.
 * @param file The PDF file object from an input element.
 * @returns A promise that resolves to a single string containing all the text from the PDF.
 */
export const extractTextFromPdf = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (event) => {
      if (!event.target?.result) {
        return reject(new Error("Failed to read file."));
      }

      try {
        const pdf = await pdfjsLib.getDocument(event.target.result).promise;
        const numPages = pdf.numPages;
        let fullText = '';

        for (let i = 1; i <= numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: any) => item.str).join(' ');
          fullText += pageText + '\n\n';
        }

        resolve(fullText.trim());
      } catch (error) {
        console.error("Error processing PDF:", error);
        reject(new Error("Could not process the PDF file. It might be corrupted or protected."));
      }
    };

    reader.onerror = (error) => {
      console.error("FileReader error:", error);
      reject(new Error("An error occurred while reading the file."));
    };

    reader.readAsArrayBuffer(file);
  });
};
