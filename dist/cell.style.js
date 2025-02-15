const headerStyle = {
    fill: {
        fgColor: { rgb: "FFFFFF" }
    },
    font: {
        bold: true,
        sz: 11,
        name: "Calibri"
    },
    alignment: {
        vertical: "center",
        horizontal: "center",
        wrapText: true
    },
    border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } }
    }
};

const headerNumberStyle = {
    ...headerStyle,
    font: {
        ...headerStyle.font,
        bold: false,
        italic: true,
        sz: 8
    },
};

const dataStyle = {
    font: {
        sz: 11,
        name: "Calibri"
    },
    alignment: {
        vertical: "center",
        horizontal: "left",
        wrapText: true
    },
    border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } }
    }
};

const numberStyle = {
    ...dataStyle,
    alignment: {
        ...dataStyle.alignment,
        horizontal: "right"
    },
    numFmt: "#,##0"
};