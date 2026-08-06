import { useState, useEffect, useRef, memo } from "react";
import { X, Upload, PackagePlus, Edit, ImagePlus, Trash2, Link } from "lucide-react";

const ProductModal = memo(({ isOpen, onClose, onSubmit, initialData, isSubmitting }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    category: "",
    images: [],
  });

  const [uploadTab, setUploadTab] = useState("file"); // "file" | "url"
  const [urlInput, setUrlInput] = useState("");
  const fileInputRef = useRef(null);

  // 모달 열림/닫힘 및 수정 대상 변경 시 폼 상태 안전 초기화 (useEffect 사용)
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          name: initialData.name || "",
          description: initialData.description || "",
          price: initialData.price || "",
          stock: initialData.stock || "",
          category: initialData.category || "",
          images:
            initialData.images && initialData.images.length > 0
              ? [...initialData.images]
              : [],
        });
      } else {
        setFormData({
          name: "",
          description: "",
          price: "",
          stock: "",
          category: "",
          images: [],
        });
      }
      setUrlInput("");
      setUploadTab("file");
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // PC 파일 업로드 처리 (FileReader -> Base64)
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (formData.images.length + files.length > 3) {
      alert("이미지는 최대 3개까지 등록할 수 있습니다.");
      return;
    }

    const promises = files.map((file) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(promises)
      .then((base64Images) => {
        setFormData((prev) => ({
          ...prev,
          images: [...prev.images, ...base64Images].slice(0, 3),
        }));
      })
      .catch((err) => {
        console.error("파일 읽기 오류:", err);
        alert("이미지 파일을 읽는데 실패했습니다.");
      });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleAddUrl = () => {
    if (!urlInput.trim()) return;
    if (formData.images.length >= 3) {
      alert("이미지는 최대 3개까지 등록할 수 있습니다.");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, urlInput.trim()],
    }));
    setUrlInput("");
  };

  const handleRemoveImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.images.length === 0) {
      alert("최소 1개 이상의 상품 이미지를 등록해 주세요.");
      return;
    }

    onSubmit({
      ...formData,
      price: Number(formData.price),
      stock: Number(formData.stock),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900">
          <div className="flex items-center gap-2.5">
            {initialData ? (
              <Edit className="w-5 h-5 text-indigo-400" />
            ) : (
              <PackagePlus className="w-5 h-5 text-indigo-400" />
            )}
            <h3 className="text-lg font-bold text-slate-100">
              {initialData ? "상품 정보 수정" : "신규 상품 등록"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-circle btn-sm text-slate-400 hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              상품명 *
            </label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="예: 프리미엄 무선 헤드폰"
              className="input input-bordered w-full bg-slate-800 text-sm text-slate-100 placeholder:text-slate-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                가격 (원) *
              </label>
              <input
                type="number"
                name="price"
                required
                min="0"
                value={formData.price}
                onChange={handleChange}
                placeholder="150000"
                className="input input-bordered w-full bg-slate-800 text-sm text-slate-100 placeholder:text-slate-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                재고 수량 *
              </label>
              <input
                type="number"
                name="stock"
                required
                min="0"
                value={formData.stock}
                onChange={handleChange}
                placeholder="50"
                className="input input-bordered w-full bg-slate-800 text-sm text-slate-100 placeholder:text-slate-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              카테고리 *
            </label>
            <select
              name="category"
              required
              value={formData.category}
              onChange={handleChange}
              className="select select-bordered w-full bg-slate-800 text-sm text-slate-100"
            >
              <option value="">카테고리 선택</option>
              <option value="Electronics">Electronics (전자기기)</option>
              <option value="Clothing">Clothing (의류/패션)</option>
              <option value="Home">Home & Living (생활/가전)</option>
              <option value="Beauty">Beauty (뷰티/화장품)</option>
              <option value="Books">Books (도서)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              상품 상세 설명 *
            </label>
            <textarea
              name="description"
              required
              rows="3"
              value={formData.description}
              onChange={handleChange}
              placeholder="상품에 대한 명확한 특징 및 설명을 입력해 주세요."
              className="textarea textarea-bordered w-full bg-slate-800 text-sm text-slate-100 placeholder:text-slate-500"
            ></textarea>
          </div>

          {/* PC Image File Upload & URL Section */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                상품 이미지 등록 ({formData.images.length}/3개) *
              </label>

              <div className="join border border-slate-700 bg-slate-800">
                <button
                  type="button"
                  onClick={() => setUploadTab("file")}
                  className={`btn btn-xs join-item ${
                    uploadTab === "file" ? "btn-primary" : "btn-ghost text-slate-400"
                  }`}
                >
                  <Upload className="w-3 h-3" />
                  <span>PC 파일 선택</span>
                </button>
                <button
                  type="button"
                  onClick={() => setUploadTab("url")}
                  className={`btn btn-xs join-item ${
                    uploadTab === "url" ? "btn-primary" : "btn-ghost text-slate-400"
                  }`}
                >
                  <Link className="w-3 h-3" />
                  <span>URL 입력</span>
                </button>
              </div>
            </div>

            {/* PC File Upload Drop Area */}
            {uploadTab === "file" && (
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  multiple
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={formData.images.length >= 3}
                  className="w-full border-2 border-dashed border-slate-700 hover:border-indigo-500 bg-slate-800/40 hover:bg-slate-800/80 rounded-2xl p-5 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  <div className="p-3 bg-slate-800 rounded-xl border border-slate-700 text-indigo-400 group-hover:scale-110 transition-transform">
                    <ImagePlus className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">
                      PC에서 이미지 파일 찾기
                    </span>
                    <span className="text-[11px] text-slate-400">
                      PNG, JPG, WEBP 지원 (최대 3개)
                    </span>
                  </div>
                </button>
              </div>
            )}

            {/* URL Input Area */}
            {uploadTab === "url" && (
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="input input-sm input-bordered flex-1 bg-slate-800 text-xs text-slate-100 placeholder:text-slate-500"
                />
                <button
                  type="button"
                  onClick={handleAddUrl}
                  disabled={formData.images.length >= 3 || !urlInput.trim()}
                  className="btn btn-primary btn-sm text-xs"
                >
                  추가
                </button>
              </div>
            )}

            {/* Image Preview List */}
            {formData.images.length > 0 && (
              <div className="grid grid-cols-3 gap-3 pt-2">
                {formData.images.map((img, idx) => (
                  <div
                    key={idx}
                    className="relative group rounded-xl overflow-hidden border border-slate-700 bg-slate-800 aspect-square"
                  >
                    <img
                      src={img}
                      alt={`미리보기 ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="btn btn-error btn-xs btn-circle absolute top-1.5 right-1.5 shadow-md opacity-90 group-hover:opacity-100"
                      title="이미지 삭제"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <span className="badge badge-neutral badge-xs absolute bottom-1 left-1.5">
                      #{idx + 1}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost btn-sm font-semibold"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary btn-sm px-6 font-semibold shadow-lg shadow-indigo-600/30"
            >
              {isSubmitting ? (
                <>
                  <span className="loading loading-spinner loading-xs"></span>
                  저장 중...
                </>
              ) : initialData ? (
                "수정 완료"
              ) : (
                "상품 등록"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

ProductModal.displayName = "ProductModal";

export default ProductModal;
