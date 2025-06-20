import React from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const DownloadPageAsPDF = () => {
  const downloadPDF = () => {
    const input = document.getElementById("pdf-content");

    html2canvas(input).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save("page.pdf");
    });
  };

  return (
    <div>
      {/* Content to download */}
      <div id="pdf-content">
        <h1>This is the content of the page</h1>
        <p>You can style this however you want</p>
      </div>

      {/* Download Button */}
      <button onClick={downloadPDF} className="bg-blue-500 text-white px-4 py-2 rounded mt-4">
        Download PDF
      </button>
    </div>
  );
};

export default DownloadPageAsPDF;
