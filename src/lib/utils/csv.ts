function convertToCSV(data: any) {
  if (!data.length) return "";

  const headers = Object.keys(data[0]).join(",");

  const rows = data.map((row: any) =>
    Object.values(row)
      .map((value) => `"${value}"`)
      .join(","),
  );

  return [headers, ...rows].join("\n");
}

function downloadCSV(data: any) {
  const csv = convertToCSV(data);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "export.csv");

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
