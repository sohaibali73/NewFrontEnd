/**
 * Potomac InDesign Manifest Exporter
 * Version: 1.0
 * 
 * HOW TO RUN:
 *   1. Open your InDesign presentation document
 *   2. Go to File > Scripts > Script Editor (or Window > Utilities > Scripts)
 *   3. Paste this entire script and click Run
 *   4. A JSON file will be saved next to your .indd file
 *   5. Also exports each page as a high-res PNG into an /exports/ folder
 * 
 * OUTPUT: <DocumentName>_manifest.json + /exports/slide_XX.png
 */

// NOTE: #target indesign removed — not needed when running via COM DoScript
// and can cause issues with InDesign 2026+

// ─── JSON POLYFILL FOR EXTENDSCRIPT (ES3) ───────────────────────────────────
var JSON;
try { JSON = JSON || {}; } catch(e) { JSON = {}; }
if (!JSON.stringify) {
    JSON.stringify = function(obj, replacer, space) {
        var indent = "";
        var step = "";
        if (typeof space === "number") {
            for (var s = 0; s < space; s++) step += " ";
        } else if (typeof space === "string") {
            step = space;
        }
        function ser(val, depth) {
            var pad = "";
            var childPad = "";
            if (step) {
                for (var d = 0; d < depth; d++) pad += step;
                childPad = pad + step;
            }
            if (val === null || val === undefined) return "null";
            if (typeof val === "boolean") return val ? "true" : "false";
            if (typeof val === "number") {
                if (!isFinite(val)) return "null";
                return String(val);
            }
            if (typeof val === "string") {
                return '"' + val.replace(/\\/g, "\\\\").replace(/"/g, '\\"')
                    .replace(/\n/g, "\\n").replace(/\r/g, "\\r")
                    .replace(/\t/g, "\\t") + '"';
            }
            if (val instanceof Array) {
                if (val.length === 0) return "[]";
                var items = [];
                for (var i = 0; i < val.length; i++) {
                    items.push(ser(val[i], depth + 1));
                }
                if (step) return "[\n" + childPad + items.join(",\n" + childPad) + "\n" + pad + "]";
                return "[" + items.join(",") + "]";
            }
            if (typeof val === "object") {
                var keys = [];
                for (var k in val) {
                    if (val.hasOwnProperty(k)) keys.push(k);
                }
                if (keys.length === 0) return "{}";
                var pairs = [];
                for (var ki = 0; ki < keys.length; ki++) {
                    var key = keys[ki];
                    pairs.push('"' + key + '": ' + ser(val[key], depth + 1));
                }
                if (step) return "{\n" + childPad + pairs.join(",\n" + childPad) + "\n" + pad + "}";
                return "{" + pairs.join(",") + "}";
            }
            return "null";
        }
        return ser(obj, 0);
    };
}

(function() {

    // ─── SAFETY CHECK ───────────────────────────────────────────────────────────
    if (app.documents.length === 0) {
        alert("No document open. Please open your Potomac InDesign file first.");
        exit();
    }

    var doc = app.activeDocument;
    var docPath = doc.filePath;
    var docName = doc.name.replace(/\.indd$/i, "");

    // ─── OUTPUT PATHS ────────────────────────────────────────────────────────────
    var outputFolder = new Folder(docPath + "/potomac_export");
    if (!outputFolder.exists) outputFolder.create();

    var imagesFolder = new Folder(outputFolder.absoluteURI + "/slide_images");
    if (!imagesFolder.exists) imagesFolder.create();

    // ─── GET DOCUMENT DIMENSIONS ─────────────────────────────────────────────────
    var firstPage = doc.pages[0];
    var docWidth  = firstPage.bounds[3] - firstPage.bounds[1];   // in points
    var docHeight = firstPage.bounds[2] - firstPage.bounds[0];   // in points
    var docWidthIn  = docWidth  / 72;
    var docHeightIn = docHeight / 72;

    // ─── HELPER: CMYK/RGB COLOR → HEX ────────────────────────────────────────────
    function colorToHex(colorObj) {
        if (!colorObj || colorObj.constructor.name === "NothingEnum") return null;
        try {
            var name = colorObj.name;
            if (name === "None" || name === "[None]") return null;
            if (name === "Paper" || name === "[Paper]") return "FFFFFF";
            if (name === "Black" || name === "[Black]") return "000000";

            var model = colorObj.space;
            var vals  = colorObj.colorValue;

            if (model === ColorSpace.CMYK) {
                var c = vals[0] / 100, m = vals[1] / 100,
                    y = vals[2] / 100, k = vals[3] / 100;
                var r = Math.round(255 * (1 - c) * (1 - k));
                var g = Math.round(255 * (1 - m) * (1 - k));
                var b = Math.round(255 * (1 - y) * (1 - k));
                return toHex(r) + toHex(g) + toHex(b);
            }
            if (model === ColorSpace.RGB) {
                return toHex(Math.round(vals[0])) +
                       toHex(Math.round(vals[1])) +
                       toHex(Math.round(vals[2]));
            }
        } catch(e) {}
        return null;
    }

    function toHex(n) {
        var h = n.toString(16).toUpperCase();
        return h.length < 2 ? "0" + h : h;
    }

    // ─── HELPER: BOUNDS → POSITION OBJECT ────────────────────────────────────────
    // InDesign bounds = [y1, x1, y2, x2] from page origin (points)
    function boundsToPos(bounds, pageY, pageX) {
        var x  = bounds[1] - pageX;
        var y  = bounds[0] - pageY;
        var w  = bounds[3] - bounds[1];
        var h  = bounds[2] - bounds[0];
        return {
            x_pt: parseFloat(x.toFixed(2)),
            y_pt: parseFloat(y.toFixed(2)),
            w_pt: parseFloat(w.toFixed(2)),
            h_pt: parseFloat(h.toFixed(2)),
            x_in: parseFloat((x / 72).toFixed(4)),
            y_in: parseFloat((y / 72).toFixed(4)),
            w_in: parseFloat((w / 72).toFixed(4)),
            h_in: parseFloat((h / 72).toFixed(4)),
            x_pct: parseFloat((x / docWidth  * 100).toFixed(2)),
            y_pct: parseFloat((y / docHeight * 100).toFixed(2)),
            w_pct: parseFloat((w / docWidth  * 100).toFixed(2)),
            h_pct: parseFloat((h / docHeight * 100).toFixed(2))
        };
    }

    // ─── HELPER: EXTRACT PARAGRAPH STYLES ────────────────────────────────────────
    function extractParagraphStyles(textFrame) {
        var styles = [];
        try {
            var paras = textFrame.paragraphs;
            for (var p = 0; p < paras.length && p < 20; p++) {
                var para = paras[p];
                var text = para.contents;
                if (!text || text === "\r" || text === "\n") continue;

                var fontName  = "Unknown";
                var fontSize  = 12;
                var fontStyle = "Regular";
                var textColor = null;
                var align     = "left";
                var bold      = false;
                var italic    = false;
                var allCaps   = false;

                try { fontName  = para.appliedFont.name; }           catch(e){}
                try { fontName  = para.appliedCharacterStyle.name || fontName; } catch(e){}
                try {
                    var appliedFont = para.appliedFont;
                    fontName  = appliedFont.fontFamily;
                    fontStyle = appliedFont.fontStyleName;
                    bold      = (fontStyle.toLowerCase().indexOf("bold") >= 0);
                    italic    = (fontStyle.toLowerCase().indexOf("italic") >= 0);
                } catch(e){}
                try { fontSize  = para.pointSize; }                   catch(e){}
                try { textColor = colorToHex(para.fillColor); }       catch(e){}
                try {
                    var j = para.justification;
                    if (j === Justification.CENTER_ALIGN ||
                        j === Justification.CENTER_JUSTIFIED) align = "center";
                    else if (j === Justification.RIGHT_ALIGN ||
                             j === Justification.RIGHT_JUSTIFIED) align = "right";
                    else align = "left";
                } catch(e){}
                try { allCaps = para.capitalization === Capitalization.ALL_CAPS; } catch(e){}

                styles.push({
                    text:       text.replace(/\r/g, "\n").replace(/\n+$/, ""),
                    font:       fontName,
                    style:      fontStyle,
                    size_pt:    parseFloat(fontSize.toFixed(1)),
                    color:      textColor,
                    align:      align,
                    bold:       bold,
                    italic:     italic,
                    all_caps:   allCaps
                });
            }
        } catch(e) {}
        return styles;
    }

    // ─── HELPER: DETECT ITEM TYPE ─────────────────────────────────────────────────
    function getItemType(item) {
        var cn = item.constructor.name;
        if (cn === "TextFrame")  return "text";
        if (cn === "Rectangle" || cn === "Oval" || cn === "Polygon") {
            // Does it have an image/graphic?
            try {
                if (item.images.length > 0 || item.graphics.length > 0) return "image";
            } catch(e){}
            return "shape";
        }
        if (cn === "Group")  return "group";
        if (cn === "Line")   return "line";
        return "other";
    }

    // ─── HELPER: PROCESS ONE PAGE ITEM ────────────────────────────────────────────
    function processItem(item, pageY, pageX, depth) {
        if (depth > 4) return null; // prevent infinite recursion on nested groups
        try {
            var itemType = getItemType(item);
            var bounds   = item.geometricBounds; // [y1, x1, y2, x2]
            var pos      = boundsToPos(bounds, pageY, pageX);

            // Skip invisible or zero-size items
            if (pos.w_pt < 1 || pos.h_pt < 1) return null;

            var result = {
                type:      itemType,
                position:  pos,
                layer:     "unknown"
            };

            try { result.layer = item.itemLayer.name; } catch(e){}

            if (itemType === "text") {
                result.text_content = "";
                try { result.text_content = item.contents; } catch(e){}
                result.paragraphs = extractParagraphStyles(item);
                try {
                    result.fill_color = colorToHex(item.fillColor);
                    result.is_transparent = (item.fillColor.name === "None" ||
                                             item.fillColor.name === "[None]");
                } catch(e) { result.is_transparent = true; }
                try {
                    result.stroke_color = colorToHex(item.strokeColor);
                    result.stroke_weight = item.strokeWeight;
                } catch(e){}
            }

            if (itemType === "shape") {
                try {
                    result.fill_color   = colorToHex(item.fillColor);
                    result.stroke_color = colorToHex(item.strokeColor);
                    result.stroke_weight = item.strokeWeight;
                    result.corner_radius = 0;
                    try { result.corner_radius = item.topLeftCornerRadius; } catch(e){}
                } catch(e){}
                try {
                    result.opacity = item.transparencySettings.blendingSettings.opacity;
                } catch(e) { result.opacity = 100; }
            }

            if (itemType === "image") {
                result.is_placeholder = true;
                try {
                    var img = item.images[0] || item.graphics[0];
                    result.linked_file = img.itemLink ? img.itemLink.name : null;
                } catch(e) {}
                try {
                    result.fill_color = colorToHex(item.fillColor);
                } catch(e){}
            }

            if (itemType === "group") {
                result.children = [];
                try {
                    var items = item.allPageItems;
                    for (var i = 0; i < items.length; i++) {
                        var child = processItem(items[i], pageY, pageX, depth + 1);
                        if (child) result.children.push(child);
                    }
                } catch(e){}
            }

            return result;

        } catch(e) {
            return null;
        }
    }

    // ─── HELPER: EXPORT PAGE AS PNG ───────────────────────────────────────────────
    function exportPageAsPNG(page, slideNum) {
        try {
            var exportFile = new File(imagesFolder.absoluteURI +
                                      "/slide_" + padNum(slideNum) + ".png");
            var opts = app.pngExportPreferences;
            opts.antiAlias            = true;
            opts.exportingSpread      = false;
            opts.pageString           = String(page.name);
            opts.pngQuality           = PNGQuality.MAXIMUM;
            opts.resolveFontMissing   = true;
            opts.simulateOverprint    = false;
            opts.exportResolution     = 144; // 2x for retina-quality references
            opts.transparentBackground = false;
            opts.whiteBackground      = true;
            doc.exportFile(ExportFormat.PNG_FORMAT, exportFile, false);
            return exportFile.absoluteURI;
        } catch(e) {
            return null;
        }
    }

    function padNum(n) {
        return n < 10 ? "0" + n : String(n);
    }

    // ─── MAIN LOOP: PROCESS ALL PAGES ────────────────────────────────────────────
    var manifest = {
        document_name:    docName,
        deck_family:      docName.toLowerCase().replace(/\s+/g, "-"),
        total_slides:     doc.pages.length,
        slide_width_in:   parseFloat(docWidthIn.toFixed(4)),
        slide_height_in:  parseFloat(docHeightIn.toFixed(4)),
        slide_width_pt:   parseFloat(docWidth.toFixed(2)),
        slide_height_pt:  parseFloat(docHeight.toFixed(2)),
        aspect_ratio:     parseFloat((docWidthIn / docHeightIn).toFixed(4)),
        generated_at:     (function(){ var d = new Date(); return d.getFullYear() + "-" + padNum(d.getMonth()+1) + "-" + padNum(d.getDate()) + "T" + padNum(d.getHours()) + ":" + padNum(d.getMinutes()) + ":" + padNum(d.getSeconds()); })(),
        slides:           []
    };

    app.scriptPreferences.userInteractionLevel =
        UserInteractionLevels.NEVER_INTERACT;

    for (var pageIdx = 0; pageIdx < doc.pages.length; pageIdx++) {
        var page     = doc.pages[pageIdx];
        var pageY    = page.bounds[0]; // top of page in document coords
        var pageX    = page.bounds[1]; // left of page in document coords
        var slideNum = pageIdx + 1;

        $.writeln("Processing slide " + slideNum + " of " + doc.pages.length + "...");

        var slideData = {
            slide_number:    slideNum,
            page_name:       String(page.name),
            template_id:     null,     // you will fill this in manually or via the converter
            background_color: null,
            items:           [],
            image_export:    null
        };

        // Detect background color from a full-page rectangle on the bottom layer
        var allItems = page.allPageItems;
        for (var i = 0; i < allItems.length; i++) {
            var it = allItems[i];
            try {
                var ib = it.geometricBounds;
                var iw = ib[3] - ib[1];
                var ih = ib[2] - ib[0];
                // Full-page shape = within 5% of full dimensions
                if (iw >= docWidth * 0.9 && ih >= docHeight * 0.9) {
                    var bgColor = colorToHex(it.fillColor);
                    if (bgColor) { slideData.background_color = bgColor; break; }
                }
            } catch(e){}
        }

        // Process all items
        for (var i = 0; i < allItems.length; i++) {
            var processed = processItem(allItems[i], pageY, pageX, 0);
            if (processed) slideData.items.push(processed);
        }

        // Export PNG reference image
        slideData.image_export = exportPageAsPNG(page, slideNum);

        manifest.slides.push(slideData);
    }

    app.scriptPreferences.userInteractionLevel =
        UserInteractionLevels.INTERACT_WITH_ALERTS;

    // ─── WRITE JSON ───────────────────────────────────────────────────────────────
    var jsonFile = new File(outputFolder.absoluteURI + "/" + docName + "_manifest.json");
    jsonFile.encoding = "UTF-8";
    jsonFile.open("w");
    jsonFile.write(JSON.stringify(manifest, null, 2));
    jsonFile.close();

    // Return result string (no alert — compatible with COM automation)
    var resultMsg = "Export complete: " + doc.pages.length + " slides. Manifest: " + jsonFile.absoluteURI;
    $.writeln(resultMsg);
    resultMsg; // return value for DoScript

})();
