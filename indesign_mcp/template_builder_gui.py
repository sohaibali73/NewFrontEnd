"""
Potomac Template Builder GUI — Claude-Powered
Upload PDF + select assets folder -> Claude analyzes -> pptxgenjs templates
"""
import os, sys, json, threading
from pathlib import Path
from datetime import datetime
import tkinter as tk
from tkinter import ttk, filedialog, messagebox, scrolledtext

try:
    from PIL import Image, ImageTk
    import fitz
    HAS_PREVIEW = True
except ImportError:
    HAS_PREVIEW = False

from claude_template_engine import (
    build_templates_with_claude, scan_assets_folder, get_api_key
)

SCRIPT_DIR = Path(__file__).parent
OUTPUT_BASE = SCRIPT_DIR.parent / "pptx_engine" / "templates"
TEST_GEN = SCRIPT_DIR / "test_generate.py"


class App:
    def __init__(self, root):
        self.root = root
        root.title("Potomac Template Builder")
        root.geometry("1050x780")
        root.configure(bg="#1a1a2e")
        self.pdf_path = tk.StringVar()
        self.assets_folder = tk.StringVar()
        self.deck_name = tk.StringVar(value="bull-bear")
        self.pdf_images = []
        self.page_idx = 0
        self._build()

    def _build(self):
        s = ttk.Style(); s.theme_use("clam")
        s.configure("H.TLabel", font=("Segoe UI", 18, "bold"), fg="#FEC00F", bg="#1a1a2e")
        s.configure("S.TLabel", font=("Segoe UI", 10), fg="#ccc", bg="#1a1a2e")
        s.configure("D.TFrame", background="#1a1a2e")
        s.configure("C.TLabelframe", background="#16213e")
        s.configure("C.TLabelframe.Label", background="#16213e", foreground="#FEC00F",
                     font=("Segoe UI", 10, "bold"))
        m = ttk.Frame(self.root, style="D.TFrame")
        m.pack(fill=tk.BOTH, expand=True, padx=8, pady=8)

        # Header
        tk.Label(m, text="POTOMAC TEMPLATE BUILDER", font=("Segoe UI", 18, "bold"),
                 fg="#FEC00F", bg="#1a1a2e").pack(anchor="w")
        tk.Label(m, text="Claude Vision + Asset Scanning + pptxgenjs Output",
                 font=("Segoe UI", 10), fg="#888", bg="#1a1a2e").pack(anchor="w", pady=(0,8))

        body = ttk.Frame(m, style="D.TFrame")
        body.pack(fill=tk.BOTH, expand=True)

        # LEFT — Preview
        left = ttk.LabelFrame(body, text=" Slide Preview ", style="C.TLabelframe")
        left.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=(0,4))
        self.canvas = tk.Canvas(left, bg="#0f0f23", highlightthickness=0)
        self.canvas.pack(fill=tk.BOTH, expand=True, padx=4, pady=4)
        nav = ttk.Frame(left, style="D.TFrame")
        nav.pack(fill=tk.X, padx=4, pady=(0,4))
        tk.Button(nav, text="< Prev", command=self._prev, bg="#16213e", fg="#fff",
                  relief="flat").pack(side=tk.LEFT)
        self.pg_lbl = tk.Label(nav, text="No PDF", bg="#1a1a2e", fg="#888",
                               font=("Segoe UI", 9))
        self.pg_lbl.pack(side=tk.LEFT, expand=True)
        tk.Button(nav, text="Next >", command=self._next, bg="#16213e", fg="#fff",
                  relief="flat").pack(side=tk.RIGHT)

        # RIGHT — Controls
        rt = ttk.Frame(body, style="D.TFrame", width=370)
        rt.pack(side=tk.RIGHT, fill=tk.Y, padx=(4,0)); rt.pack_propagate(False)

        # PDF
        f1 = ttk.LabelFrame(rt, text=" 1. Select PDF ", style="C.TLabelframe")
        f1.pack(fill=tk.X, pady=(0,6))
        r1 = ttk.Frame(f1, style="D.TFrame"); r1.pack(fill=tk.X, padx=4, pady=4)
        tk.Entry(r1, textvariable=self.pdf_path, width=28, bg="#0f0f23", fg="#fff",
                 insertbackground="#FEC00F").pack(side=tk.LEFT, fill=tk.X, expand=True)
        tk.Button(r1, text="Browse", command=self._pick_pdf, bg="#16213e",
                  fg="#FEC00F", relief="flat").pack(side=tk.RIGHT, padx=(4,0))

        # Assets
        f2 = ttk.LabelFrame(rt, text=" 2. Assets Folder ", style="C.TLabelframe")
        f2.pack(fill=tk.X, pady=(0,6))
        r2 = ttk.Frame(f2, style="D.TFrame"); r2.pack(fill=tk.X, padx=4, pady=4)
        tk.Entry(r2, textvariable=self.assets_folder, width=28, bg="#0f0f23", fg="#fff",
                 insertbackground="#FEC00F").pack(side=tk.LEFT, fill=tk.X, expand=True)
        tk.Button(r2, text="Browse", command=self._pick_assets, bg="#16213e",
                  fg="#FEC00F", relief="flat").pack(side=tk.RIGHT, padx=(4,0))
        self.asset_info = tk.Label(f2, text="", bg="#16213e", fg="#00DED1",
                                    font=("Segoe UI", 8))
        self.asset_info.pack(padx=4, pady=(0,4))

        # Deck name
        f3 = ttk.LabelFrame(rt, text=" 3. Deck Family ", style="C.TLabelframe")
        f3.pack(fill=tk.X, pady=(0,6))
        tk.Entry(f3, textvariable=self.deck_name, width=28, bg="#0f0f23", fg="#fff",
                 insertbackground="#FEC00F", font=("Segoe UI", 11)).pack(padx=4, pady=4)

        # Build button
        f4 = ttk.LabelFrame(rt, text=" 4. Build ", style="C.TLabelframe")
        f4.pack(fill=tk.X, pady=(0,6))
        self.build_btn = tk.Button(f4, text="BUILD WITH CLAUDE",
                                    font=("Segoe UI", 13, "bold"),
                                    fg="#212121", bg="#FEC00F",
                                    activebackground="#FFD740",
                                    command=self._start_build, height=2)
        self.build_btn.pack(fill=tk.X, padx=4, pady=4)
        self.progress = ttk.Progressbar(f4, mode="indeterminate")
        self.progress.pack(fill=tk.X, padx=4, pady=(0,4))
        self.status = tk.Label(f4, text="Ready", bg="#16213e", fg="#00DED1",
                               font=("Segoe UI", 9))
        self.status.pack(padx=4, pady=(0,4))

        # Actions
        fa = ttk.Frame(rt, style="D.TFrame")
        fa.pack(fill=tk.X, pady=(0,6))
        self.test_btn = tk.Button(fa, text="Generate Test PPTX", bg="#16213e",
                                   fg="#fff", relief="flat", command=self._test_gen,
                                   state=tk.DISABLED)
        self.test_btn.pack(fill=tk.X, pady=1)
        tk.Button(fa, text="Open Output", bg="#16213e", fg="#fff", relief="flat",
                  command=self._open_out).pack(fill=tk.X, pady=1)

        # API status
        key = get_api_key()
        key_status = "Connected" if key else "NOT FOUND"
        tk.Label(rt, text=f"Claude API: {key_status}", bg="#1a1a2e",
                 fg="#00DED1" if key else "#EB2F5C",
                 font=("Segoe UI", 9)).pack(anchor="w", pady=(4,0))

        # Log
        lf = ttk.LabelFrame(m, text=" Log ", style="C.TLabelframe")
        lf.pack(fill=tk.BOTH, expand=False, pady=(8,0))
        self.log = scrolledtext.ScrolledText(lf, height=8, bg="#0f0f23", fg="#00DED1",
                                              font=("Consolas", 9),
                                              insertbackground="#FEC00F")
        self.log.pack(fill=tk.BOTH, expand=True, padx=4, pady=4)
        self._msg("Potomac Template Builder ready.")
        if not key:
            self._msg("WARNING: No ANTHROPIC_API_KEY in .env — Claude features disabled")

    def _msg(self, t):
        ts = datetime.now().strftime("%H:%M:%S")
        self.log.insert(tk.END, f"[{ts}] {t}\n"); self.log.see(tk.END)

    def _pick_pdf(self):
        p = filedialog.askopenfilename(filetypes=[("PDF", "*.pdf")])
        if p:
            self.pdf_path.set(p); self._msg(f"PDF: {os.path.basename(p)}")
            self.deck_name.set(Path(p).stem.lower().replace(" ","-").replace("_","-"))
            if HAS_PREVIEW: self._load_preview(p)
            # Auto-set assets folder to PDF's parent
            self.assets_folder.set(str(Path(p).parent))
            self._scan_assets()

    def _pick_assets(self):
        p = filedialog.askdirectory(title="Select Assets Folder")
        if p:
            self.assets_folder.set(p); self._scan_assets()

    def _scan_assets(self):
        af = self.assets_folder.get()
        if af and os.path.isdir(af):
            a = scan_assets_folder(af)
            txt = (f"{a['total']} files: {len(a['images'])} img, "
                   f"{len(a['indesign'])} indd, {len(a['illustrator'])} ai")
            self.asset_info.config(text=txt)
            self._msg(f"Assets: {txt}")

    def _load_preview(self, path):
        try:
            doc = fitz.open(path); self.pdf_images = []
            for i in range(min(doc.page_count, 20)):
                pg = doc.load_page(i)
                pix = pg.get_pixmap(matrix=fitz.Matrix(1.5, 1.5))
                img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
                self.pdf_images.append(img)
            doc.close(); self.page_idx = 0; self._show_page()
        except Exception as e:
            self._msg(f"Preview error: {e}")

    def _show_page(self):
        if not self.pdf_images: return
        img = self.pdf_images[self.page_idx]
        cw = self.canvas.winfo_width() or 500
        ch = self.canvas.winfo_height() or 400
        r = min(cw/img.width, ch/img.height)
        resized = img.resize((int(img.width*r), int(img.height*r)), Image.LANCZOS)
        self._tk_img = ImageTk.PhotoImage(resized)
        self.canvas.delete("all")
        self.canvas.create_image(cw//2, ch//2, image=self._tk_img)
        self.pg_lbl.config(text=f"Page {self.page_idx+1}/{len(self.pdf_images)}")

    def _prev(self):
        if self.pdf_images and self.page_idx > 0:
            self.page_idx -= 1; self._show_page()

    def _next(self):
        if self.pdf_images and self.page_idx < len(self.pdf_images) - 1:
            self.page_idx += 1; self._show_page()

    def _start_build(self):
        pdf = self.pdf_path.get()
        if not pdf or not os.path.exists(pdf):
            messagebox.showerror("Error", "Select a valid PDF"); return
        af = self.assets_folder.get()
        if not af or not os.path.isdir(af):
            messagebox.showerror("Error", "Select assets folder"); return
        dk = self.deck_name.get().strip()
        if not dk:
            messagebox.showerror("Error", "Enter deck name"); return

        out = str(OUTPUT_BASE / dk)
        self.build_btn.config(state=tk.DISABLED, text="BUILDING...")
        self.progress.start(10); self.status.config(text="Claude is analyzing slides...")

        def run():
            def log(t):
                self.root.after(0, lambda: self._msg(t))
            try:
                result = build_templates_with_claude(pdf, af, out, log)
                self.root.after(0, lambda: self._done(True, out))
            except Exception as e:
                self.root.after(0, lambda: self._msg(f"ERROR: {e}"))
                self.root.after(0, lambda: self._done(False))

        threading.Thread(target=run, daemon=True).start()

    def _done(self, ok, out=None):
        self.progress.stop()
        self.build_btn.config(state=tk.NORMAL, text="BUILD WITH CLAUDE")
        if ok:
            self.status.config(text="Done!")
            self.test_btn.config(state=tk.NORMAL)
            jsons = list(Path(out).glob("*.json")) if out else []
            self._msg(f"Output: {len(jsons)} files in {out}")
        else:
            self.status.config(text="Failed")

    def _test_gen(self):
        self._msg("Generating test PPTX...")
        try:
            import subprocess
            r = subprocess.run([sys.executable, str(TEST_GEN), "Test"],
                             capture_output=True, text=True, timeout=60)
            if r.stdout:
                for l in r.stdout.strip().split("\n"): self._msg(l)
            test_out = SCRIPT_DIR / "test_output"
            pptx = list(test_out.glob("*.pptx"))
            if pptx: os.startfile(str(pptx[-1]))
        except Exception as e:
            self._msg(f"Error: {e}")

    def _open_out(self):
        out = str(OUTPUT_BASE / self.deck_name.get())
        if os.path.isdir(out): os.startfile(out)
        else: os.startfile(str(OUTPUT_BASE))


if __name__ == "__main__":
    root = tk.Tk()
    App(root)
    root.mainloop()
