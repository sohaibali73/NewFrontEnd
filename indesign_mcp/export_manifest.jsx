/**
 * Potomac InDesign Manifest Exporter v3
 * ======================================
 * Layer-aware export: separates each element by layer, exports individual
 * graphics as PNGs, captures full linked file paths, and creates a manifest
 * that allows pixel-perfect PowerPoint reconstruction.
 *
 * Elements are exported as:
 *   - text  -> editable text data (font, size, color, position)
 *   - shape -> native shape data (fill, stroke, corners, position)
 *   - image -> individual PNG export + linked file path
 *   - group -> individual PNG export (flattened raster)
 */

// JSON polyfill for ExtendScript (ES3)
var JSON;
try { JSON = JSON || {}; } catch(e) { JSON = {}; }
if (!JSON.stringify) {
    JSON.stringify = function(obj, replacer, space) {
        var step = "";
        if (typeof space === "number") { for (var s = 0; s < space; s++) step += " "; }
        function esc(str) {
            return str.replace(/\\/g, "\\\\").replace(/"/g, '\\"')
                .replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t");
        }
        function ser(val, depth) {
            var pad = "", childPad = "";
            if (step) { for (var d = 0; d < depth; d++) pad += step; childPad = pad + step; }
            if (val === null || val === undefined) return "null";
            if (typeof val === "boolean") return val ? "true" : "false";
            if (typeof val === "number") return isFinite(val) ? String(val) : "null";
            if (typeof val === "string") return '"' + esc(val) + '"';
            if (val instanceof Array) {
                if (val.length === 0) return "[]";
                var items = [];
                for (var i = 0; i < val.length; i++) items.push(ser(val[i], depth + 1));
                return step ? "[\n" + childPad + items.join(",\n" + childPad) + "\n" + pad + "]"
                            : "[" + items.join(",") + "]";
            }
            if (typeof val === "object") {
                var keys = [], pairs = [];
                for (var k in val) { if (val.hasOwnProperty(k)) keys.push(k); }
                if (keys.length === 0) return "{}";
                for (var ki = 0; ki < keys.length; ki++) {
                    pairs.push('"' + keys[ki] + '": ' + ser(val[keys[ki]], depth + 1));
                }
                return step ? "{\n" + childPad + pairs.join(",\n" + childPad) + "\n" + pad + "}"
                            : "{" + pairs.join(",") + "}";
            }
            return "null";
        }
        return ser(obj, 0);
    };
}

(function() {
    if (app.documents.length === 0) return "ERROR: No document open";

    var doc = app.activeDocument;
    var docPath = doc.filePath;
    var docName = doc.name.replace(/\.indd$/i, "");

    // Output folders
    var outputFolder = new Folder(docPath + "/potomac_export");
    if (!outputFolder.exists) outputFolder.create();

    var elementsFolder = new Folder(outputFolder.absoluteURI + "/elements");
    if (!elementsFolder.exists) elementsFolder.create();

    var slidesFolder = new Folder(outputFolder.absoluteURI + "/slide_images");
    if (!slidesFolder.exists) slidesFolder.create();

    // Document dimensions
    var firstPage = doc.pages[0];
    var docWidth  = firstPage.bounds[3] - firstPage.bounds[1];
    var docHeight = firstPage.bounds[2] - firstPage.bounds[0];

    function padNum(n) { return n < 10 ? "0" + n : String(n); }

    // --- Color helpers ---
    function toHex(n) {
        var h = n.toString(16).toUpperCase();
        return h.length < 2 ? "0" + h : h;
    }

    function colorToHex(colorObj) {
        if (!colorObj) return null;
        try {
            var name = colorObj.name;
            if (name === "None" || name === "[None]") return null;
            if (name === "Paper" || name === "[Paper]") return "FFFFFF";
            if (name === "Black" || name === "[Black]") return "000000";
            var model = colorObj.space;
            var vals = colorObj.colorValue;
            if (model === ColorSpace.CMYK) {
                var c = vals[0]/100, m = vals[1]/100, y = vals[2]/100, k = vals[3]/100;
                return toHex(Math.round(255*(1-c)*(1-k))) +
                       toHex(Math.round(255*(1-m)*(1-k))) +
                       toHex(Math.round(255*(1-y)*(1-k)));
            }
            if (model === ColorSpace.RGB) {
                return toHex(Math.round(vals[0])) + toHex(Math.round(vals[1])) + toHex(Math.round(vals[2]));
            }
        } catch(e) {}
        return null;
    }

    // --- Position helper ---
    function boundsToPos(bounds, pageY, pageX) {
        var x = bounds[1] - pageX, y = bounds[0] - pageY;
        var w = bounds[3] - bounds[1], h = bounds[2] - bounds[0];
        return {
            x_pt: parseFloat(x.toFixed(2)), y_pt: parseFloat(y.toFixed(2)),
            w_pt: parseFloat(w.toFixed(2)), h_pt: parseFloat(h.toFixed(2)),
            x_in: parseFloat((x/72).toFixed(4)), y_in: parseFloat((y/72).toFixed(4)),
            w_in: parseFloat((w/72).toFixed(4)), h_in: parseFloat((h/72).toFixed(4)),
            x_pct: parseFloat((x/docWidth*100).toFixed(2)),
            y_pct: parseFloat((y/docHeight*100).toFixed(2)),
            w_pct: parseFloat((w/docWidth*100).toFixed(2)),
            h_pct: parseFloat((h/docHeight*100).toFixed(2))
        };
    }

    // --- Extract paragraph styles ---
    function extractParagraphs(textFrame) {
        var styles = [];
        try {
            var paras = textFrame.paragraphs;
            for (var p = 0; p < paras.length && p < 30; p++) {
                var para = paras[p];
                var text = para.contents;
                if (!text || text === "\r" || text === "\n") continue;
                var fontName = "Quicksand", fontStyle = "Regular", fontSize = 12;
                var textColor = null, align = "left", bold = false, italic = false, allCaps = false;
                try {
                    var af = para.appliedFont;
                    fontName = af.fontFamily; fontStyle = af.fontStyleName;
                    bold = (fontStyle.toLowerCase().indexOf("bold") >= 0);
                    italic = (fontStyle.toLowerCase().indexOf("italic") >= 0);
                } catch(e) {}
                try { fontSize = para.pointSize; } catch(e) {}
                try { textColor = colorToHex(para.fillColor); } catch(e) {}
                try {
                    var j = para.justification;
                    if (j === Justification.CENTER_ALIGN || j === Justification.CENTER_JUSTIFIED) align = "center";
                    else if (j === Justification.RIGHT_ALIGN || j === Justification.RIGHT_JUSTIFIED) align = "right";
                } catch(e) {}
                try { allCaps = para.capitalization === Capitalization.ALL_CAPS; } catch(e) {}
                styles.push({
                    text: text.replace(/\r/g, "\n").replace(/\n+$/, ""),
                    font: fontName, style: fontStyle, size_pt: parseFloat(fontSize.toFixed(1)),
                    color: textColor, align: align, bold: bold, italic: italic, all_caps: allCaps
                });
            }
        } catch(e) {}
        return styles;
    }

    // --- Get linked file path ---
    function getLinkedFilePath(item) {
        try {
            var graphic = null;
            if (item.images && item.images.length > 0) graphic = item.images[0];
            else if (item.graphics && item.graphics.length > 0) graphic = item.graphics[0];
            if (graphic && graphic.itemLink) {
                var link = graphic.itemLink;
                // Get full path - decode URI to filesystem path
                var fp = link.filePath;
                if (fp) return decodeURI(fp).replace(/^\//, "");
                // Fallback to name
                return link.name;
            }
        } catch(e) {}
        return null;
    }

    // --- Export individual element as PNG ---
    var exportCounter = 0;
    function exportElementAsPNG(item, slideNum) {
        exportCounter++;
        var filename = "s" + padNum(slideNum) + "_e" + padNum(exportCounter) + ".png";
        var exportFile = new File(elementsFolder.absoluteURI + "/" + filename);

        try {
            // Approach: duplicate to temp doc, export, close
            var bounds = item.geometricBounds;
            var w = bounds[3] - bounds[1];
            var h = bounds[2] - bounds[0];
            if (w < 5 || h < 5) return null; // too small

            var tmpDoc = app.documents.add();
            tmpDoc.documentPreferences.pageWidth = w + 2;
            tmpDoc.documentPreferences.pageHeight = h + 2;
            tmpDoc.pages[0].marginPreferences.properties = {top: 0, left: 0, bottom: 0, right: 0};

            // Duplicate the item to temp doc
            var copied = item.duplicate(tmpDoc.pages[0]);
            // Move to near-origin
            copied.move([1, 1]);

            // Export
            app.pngExportPreferences.antiAlias = true;
            app.pngExportPreferences.exportResolution = 144;
            app.pngExportPreferences.transparentBackground = true;
            tmpDoc.exportFile(ExportFormat.PNG_FORMAT, exportFile, false);

            tmpDoc.close(SaveOptions.NO);
            return filename;
        } catch(e) {
            try { tmpDoc.close(SaveOptions.NO); } catch(e2) {}
            return null;
        }
    }

    // --- Determine element type and extract data ---
    function processItem(item, pageY, pageX, slideNum, depth) {
        if (depth > 4) return null;
        try {
            var bounds = item.geometricBounds;
            var pos = boundsToPos(bounds, pageY, pageX);
            if (pos.w_pt < 2 || pos.h_pt < 2) return null;

            var cn = item.constructor.name;
            var layerName = "unknown";
            try { layerName = item.itemLayer.name; } catch(e) {}

            var result = { position: pos, layer: layerName };

            // TEXT FRAME -> editable text
            if (cn === "TextFrame") {
                result.type = "text";
                result.text_content = "";
                try { result.text_content = item.contents; } catch(e) {}
                result.paragraphs = extractParagraphs(item);
                try {
                    result.fill_color = colorToHex(item.fillColor);
                    result.is_transparent = (item.fillColor.name === "None" || item.fillColor.name === "[None]");
                } catch(e) { result.is_transparent = true; }
                try { result.stroke_color = colorToHex(item.strokeColor); result.stroke_weight = item.strokeWeight; } catch(e) {}
                return result;
            }

            // RECTANGLE/OVAL/POLYGON
            if (cn === "Rectangle" || cn === "Oval" || cn === "Polygon") {
                // Check if it contains a placed image
                var hasImage = false;
                try { hasImage = (item.images.length > 0 || item.graphics.length > 0); } catch(e) {}

                if (hasImage) {
                    result.type = "image";
                    result.linked_file = getLinkedFilePath(item);
                    result.linked_name = null;
                    try { result.linked_name = (item.images[0] || item.graphics[0]).itemLink.name; } catch(e) {}

                    // Export as individual PNG if we can't find linked file
                    if (!result.linked_file) {
                        result.exported_png = exportElementAsPNG(item, slideNum);
                    }
                    return result;
                }

                // Simple shape
                result.type = "shape";
                result.shape_kind = cn.toLowerCase();
                try {
                    result.fill_color = colorToHex(item.fillColor);
                    result.stroke_color = colorToHex(item.strokeColor);
                    result.stroke_weight = item.strokeWeight;
                    result.corner_radius = 0;
                    try { result.corner_radius = item.topLeftCornerRadius; } catch(e) {}
                } catch(e) {}
                try { result.opacity = item.transparencySettings.blendingSettings.opacity; } catch(e) { result.opacity = 100; }
                return result;
            }

            // GROUP -> export as PNG (too complex for native PPTX)
            if (cn === "Group") {
                result.type = "group";
                // Try to export the group as a single PNG element
                result.exported_png = exportElementAsPNG(item, slideNum);
                // Also extract children for reference
                result.child_count = 0;
                try { result.child_count = item.allPageItems.length; } catch(e) {}
                return result;
            }

            // LINE
            if (cn === "Line") {
                result.type = "line";
                try { result.stroke_color = colorToHex(item.strokeColor); result.stroke_weight = item.strokeWeight; } catch(e) {}
                return result;
            }

            // OTHER -> export as PNG
            result.type = "other";
            result.class_name = cn;
            return result;

        } catch(e) { return null; }
    }

    // --- Export full page as reference PNG ---
    function exportPagePNG(page, slideNum) {
        try {
            var exportFile = new File(slidesFolder.absoluteURI + "/slide_" + padNum(slideNum) + ".png");
            app.pngExportPreferences.antiAlias = true;
            app.pngExportPreferences.exportingSpread = false;
            app.pngExportPreferences.pageString = String(page.name);
            app.pngExportPreferences.pngQuality = PNGQuality.MAXIMUM;
            app.pngExportPreferences.exportResolution = 144;
            app.pngExportPreferences.transparentBackground = false;
            doc.exportFile(ExportFormat.PNG_FORMAT, exportFile, false);
            return "slide_" + padNum(slideNum) + ".png";
        } catch(e) { return null; }
    }

    // === MAIN LOOP ===
    var manifest = {
        document_name: docName,
        deck_family: docName.toLowerCase().replace(/\s+/g, "-"),
        total_slides: doc.pages.length,
        slide_width_in: parseFloat((docWidth / 72).toFixed(4)),
        slide_height_in: parseFloat((docHeight / 72).toFixed(4)),
        slide_width_pt: parseFloat(docWidth.toFixed(2)),
        slide_height_pt: parseFloat(docHeight.toFixed(2)),
        aspect_ratio: parseFloat(((docWidth/72) / (docHeight/72)).toFixed(4)),
        generated_at: (function(){ var d = new Date(); return d.getFullYear() + "-" + padNum(d.getMonth()+1) + "-" + padNum(d.getDate()) + "T" + padNum(d.getHours()) + ":" + padNum(d.getMinutes()) + ":" + padNum(d.getSeconds()); })(),
        layers: (function(){ var ls = []; for (var i = 0; i < doc.layers.length; i++) ls.push(doc.layers[i].name); return ls; })(),
        slides: []
    };

    app.scriptPreferences.userInteractionLevel = UserInteractionLevels.NEVER_INTERACT;

    for (var pageIdx = 0; pageIdx < doc.pages.length; pageIdx++) {
        var page = doc.pages[pageIdx];
        var pageY = page.bounds[0];
        var pageX = page.bounds[1];
        var slideNum = pageIdx + 1;

        $.writeln("Processing slide " + slideNum + "/" + doc.pages.length);

        var slideData = {
            slide_number: slideNum,
            page_name: String(page.name),
            template_id: null,
            background_color: null,
            items: [],
            reference_image: null
        };

        // Detect background (full-page shape)
        var allItems = page.allPageItems;
        for (var bi = 0; bi < allItems.length; bi++) {
            try {
                var ib = allItems[bi].geometricBounds;
                var iw = ib[3] - ib[1], ih = ib[2] - ib[0];
                if (iw >= docWidth * 0.9 && ih >= docHeight * 0.9) {
                    var bg = colorToHex(allItems[bi].fillColor);
                    if (bg) { slideData.background_color = bg; break; }
                }
            } catch(e) {}
        }

        // Process items layer-by-layer (bottom to top for z-order)
        for (var li = doc.layers.length - 1; li >= 0; li--) {
            var layer = doc.layers[li];
            if (!layer.visible) continue;

            try {
                var layerItems = page.allPageItems;
                for (var ii = 0; ii < layerItems.length; ii++) {
                    try {
                        if (layerItems[ii].itemLayer.name !== layer.name) continue;
                    } catch(e) { continue; }

                    var processed = processItem(layerItems[ii], pageY, pageX, slideNum, 0);
                    if (processed) slideData.items.push(processed);
                }
            } catch(e) {}
        }

        // Export reference PNG of full page
        slideData.reference_image = exportPagePNG(page, slideNum);

        manifest.slides.push(slideData);
    }

    app.scriptPreferences.userInteractionLevel = UserInteractionLevels.INTERACT_WITH_ALERTS;

    // Write manifest
    var jsonFile = new File(outputFolder.absoluteURI + "/" + docName + "_manifest.json");
    jsonFile.encoding = "UTF-8";
    jsonFile.open("w");
    jsonFile.write(JSON.stringify(manifest, null, 2));
    jsonFile.close();

    var msg = "Export complete: " + doc.pages.length + " slides, " + exportCounter + " element PNGs";
    $.writeln(msg);
    msg;
})();
