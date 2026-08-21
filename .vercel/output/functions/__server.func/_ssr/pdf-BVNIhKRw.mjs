const logoUrl = "/assets/exacta_logo-DfDoMtxk.png";
const loadLogoBase64 = () => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = img.width;
      c.height = img.height;
      const ctx = c.getContext("2d");
      if (ctx) ctx.drawImage(img, 0, 0);
      resolve({ dataUrl: c.toDataURL("image/png"), width: img.width, height: img.height });
    };
    img.onerror = () => resolve({ dataUrl: "", width: 0, height: 0 });
    img.src = logoUrl;
  });
};
const addBrandedHeader = async (doc, title, subtitle, dateLabel) => {
  const pw = doc.internal.pageSize.getWidth();
  const logoData = await loadLogoBase64();
  doc.setFillColor(30, 58, 138);
  doc.rect(0, 0, pw, 42, "F");
  doc.setFillColor(8, 145, 178);
  doc.rect(0, 42, pw, 2, "F");
  if (logoData.dataUrl && logoData.width > 0) {
    const maxW = 32;
    const maxH = 32;
    const ratio = Math.min(maxW / logoData.width, maxH / logoData.height);
    const w = logoData.width * ratio;
    const h = logoData.height * ratio;
    doc.addImage(logoData.dataUrl, "PNG", 12, (42 - h) / 2, w, h);
  }
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("EXACTA", logoData.dataUrl ? 48 : 14, 20);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Precisão em Gestão", logoData.dataUrl ? 48 : 14, 28);
  doc.setFontSize(12);
  doc.text(title, pw - 14, 18, { align: "right" });
  doc.setFontSize(9);
  doc.text(subtitle, pw - 14, 25, { align: "right" });
  if (dateLabel) {
    doc.text(dateLabel, pw - 14, 32, { align: "right" });
  }
  return 54;
};
const addBrandedFooter = (doc) => {
  const pw = doc.internal.pageSize.getWidth();
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    const ph = doc.internal.pageSize.getHeight();
    doc.setFillColor(30, 58, 138);
    doc.rect(0, ph - 12, pw, 12, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text("EXACTA — Precisão em Gestão", 14, ph - 4);
    doc.text(`Página ${i} de ${pages}`, pw - 14, ph - 4, { align: "right" });
  }
};
export {
  addBrandedFooter as a,
  addBrandedHeader as b
};
