import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/react';
import {
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../services';
import LoadingSpinner from '../components/LoadingSpinner';
import ProductModal from '../components/ProductModal';
import EmptyState from '../components/EmptyState';
import { formatCurrency } from '../lib/util';
import {
  Plus,
  Edit,
  Trash2,
  Search,
  PackageSearch,
  Loader2,
} from 'lucide-react';

const ProductsPage = () => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // ⏱️ 검색어 디바운스 중인지 여부를 파생 상태(Derived State)로 계산
  const isDebouncing =
    searchTerm.trim().length >= 2 && searchTerm.trim() !== debouncedSearchTerm;

  // ⏱️ 글자가 2개 이상일 때 400ms 지연 디바운스, 2글자 미만일 때 즉시 초기화
  useEffect(() => {
    const trimmed = searchTerm.trim();
    const delay = trimmed.length >= 2 ? 400 : 0;

    const timer = setTimeout(() => {
      setDebouncedSearchTerm(trimmed.length >= 2 ? trimmed : '');
    }, delay);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const {
    data: products,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['adminProducts'],
    queryFn: () => fetchProducts(getToken),
  });

  const createMutation = useMutation({
    mutationFn: (productData) => createProduct({ productData, getToken }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminProducts'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
      setIsModalOpen(false);
      alert('상품이 성공적으로 등록되었습니다!');
    },
    onError: (err) => {
      alert(`상품 등록 실패: ${err.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ productId, productData }) =>
      updateProduct({ productId, productData, getToken }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminProducts'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
      setIsModalOpen(false);
      setEditingProduct(null);
      alert('상품 정보가 성공적으로 수정되었습니다!');
    },
    onError: (err) => {
      alert(`상품 수정 실패: ${err.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (productId) => deleteProduct({ productId, getToken }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminProducts'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
      alert('상품이 성공적으로 삭제되었습니다!');
    },
    onError: (err) => {
      alert(`상품 삭제 실패: ${err.message}`);
    },
  });

  const handleOpenCreateModal = useCallback(() => {
    setEditingProduct(null);
    setIsModalOpen(true);
  }, []);

  const handleOpenEditModal = useCallback((product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  }, []);

  const handleDeleteProduct = useCallback(
    (productId, productName) => {
      if (window.confirm(`정말 [${productName}] 상품을 삭제하시겠습니까?`)) {
        deleteMutation.mutate(productId);
      }
    },
    [deleteMutation],
  );

  const handleFormSubmit = useCallback(
    (formData) => {
      if (editingProduct) {
        updateMutation.mutate({
          productId: editingProduct._id,
          productData: formData,
        });
      } else {
        createMutation.mutate(formData);
      }
    },
    [editingProduct, updateMutation, createMutation],
  );

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
  }, []);



  const filteredProducts = useMemo(() => {
    const trimmedSearch = debouncedSearchTerm.toLowerCase();
    return (products || []).filter((product) => {
      const matchesSearch =
        !trimmedSearch ||
        product.name?.toLowerCase().includes(trimmedSearch) ||
        product.category?.toLowerCase().includes(trimmedSearch);
      const matchesCategory =
        selectedCategory === 'ALL' ||
        product.category?.toLowerCase() === selectedCategory.toLowerCase();
      return matchesSearch && matchesCategory;
    });
  }, [products, debouncedSearchTerm, selectedCategory]);

  if (isLoading)
    return (
      <LoadingSpinner message="상품 카탈로그 데이터를 가져오는 중입니다..." />
    );

  if (isError) {
    return (
      <EmptyState
        icon={PackageSearch}
        title="상품 목록을 불러올 수 없습니다"
        description={error?.message || '서버 통신 중 오류가 발생했습니다.'}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 sm:gap-4 bg-base-100 border border-base-300 p-4 sm:p-5 rounded-2xl shadow-xl">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 flex-1 min-w-0">
          {/* Search Bar */}
          <div className="relative flex-1 min-w-0 w-full sm:max-w-md">
            <Search className="w-4 h-4 text-base-content/50 absolute left-3.5 top-1/2 -translate-y-1/2 z-10 pointer-events-none" />
            <input
              type="text"
              placeholder="상품명 또는 카테고리 검색 (2글자 이상)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input input-sm input-bordered w-full min-w-0 bg-base-200 text-base-content text-sm sm:text-xs pl-9 pr-9 focus:outline-primary placeholder:text-base-content/40 transition-all"
            />
            {isDebouncing && (
              <Loader2 className="w-4 h-4 text-primary animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
            )}
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="select select-sm select-bordered bg-base-200 text-base-content text-sm sm:text-xs w-full sm:w-auto shrink-0 focus:outline-primary"
          >
            <option value="ALL">전체 카테고리</option>
            <option value="Books">Books</option>
            <option value="Electronics">Electronics</option>
            <option value="Fashion">Fashion</option>
            <option value="Home">Home & Living</option>
            <option value="Sports">Sports</option>
          </select>
        </div>

        {/* Create Product Button */}
        <button
          onClick={handleOpenCreateModal}
          className="btn btn-primary btn-sm text-primary-content gap-2 font-bold shadow-lg shadow-primary/20 cursor-pointer w-full sm:w-auto shrink-0 justify-center"
        >
          <Plus className="w-4 h-4" />
          <span>신규 상품 등록</span>
        </button>
      </div>

      {/* Subheader: Total Product Count */}
      <div className="flex flex-row items-center justify-between px-2 pt-1 pb-0.5">
        <span className="text-sm font-bold text-base-content">
          상품 목록 🛍️
        </span>

        <div className="flex items-center gap-2">
          <span className="badge badge-primary badge-sm font-extrabold px-2.5 py-2 shadow-sm text-xs">
            전체 {(products?.length || 0).toLocaleString()}개
          </span>
          {(debouncedSearchTerm || selectedCategory !== 'ALL') && (
            <span className="text-xs text-base-content/60 font-medium">
              (조회 결과: {filteredProducts.length.toLocaleString()}개)
            </span>
          )}
          {searchTerm.trim().length === 1 && (
            <span className="text-xs text-warning font-medium">
              * 2글자 이상 입력 시 검색됩니다
            </span>
          )}
        </div>
      </div>

      {/* Product Table or Empty State */}
      {filteredProducts.length > 0 ? (
        <div className="bg-base-100 border border-base-300 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="table table-sm text-xs text-base-content">
              <thead className="text-[11px] uppercase bg-base-200 text-base-content/80 border-b border-base-300">
                <tr>
                  <th className="py-4 px-6">Image</th>
                  <th className="py-4 px-6">Product Name</th>
                  <th className="py-4 px-6">Category</th>
                  <th className="py-4 px-6">Price</th>
                  <th className="py-4 px-6">Stock</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-base-300">
                {filteredProducts.map((product) => (
                  <tr
                    key={product._id}
                    className="hover:bg-base-200/60 transition-colors"
                  >
                    <td className="py-3 px-6">
                      <div className="avatar relative group">
                        <div className="w-12 h-12 rounded-xl border border-base-300 overflow-hidden bg-base-200 shadow-sm">
                          <img
                            src={
                              Array.isArray(product.images) &&
                              product.images.length > 0
                                ? product.images[0]
                                : 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=150&auto=format&fit=crop&q=80'
                            }
                            alt={product.name}
                            className="w-full h-full object-cover transition-transform group-hover:scale-110"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src =
                                'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=150&auto=format&fit=crop&q=80';
                            }}
                          />
                        </div>
                        {Array.isArray(product.images) &&
                          product.images.length > 0 && (
                            <span className="badge badge-neutral badge-xs absolute -top-1 -right-1 font-bold shadow-sm">
                              {product.images.length}
                            </span>
                          )}
                      </div>
                    </td>
                    <td className="py-3 px-6">
                      <div className="font-bold text-base-content text-sm">
                        {product.name}
                      </div>
                      <div className="text-base-content/60 text-[11px] line-clamp-1 max-w-xs mt-0.5">
                        {product.description}
                      </div>
                    </td>
                    <td className="py-3 px-6">
                      <span className="badge badge-primary badge-outline text-[11px] font-medium">
                        {product.category || 'General'}
                      </span>
                    </td>
                    <td className="py-3 px-6 font-bold text-base-content">
                      {formatCurrency(product.price)}
                    </td>
                    <td className="py-3 px-6">
                      <span
                        className={`badge badge-sm font-semibold ${
                          (product.stock || 0) < 10
                            ? 'badge-error'
                            : 'badge-ghost'
                        }`}
                      >
                        {product.stock || 0}개
                      </span>
                    </td>
                    <td className="py-3 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(product)}
                          className="btn btn-ghost btn-xs border border-base-300 font-medium inline-flex items-center gap-1 hover:border-primary hover:text-primary transition-colors cursor-pointer"
                          title="상품 정보 수정"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>수정</span>
                        </button>
                        <button
                          onClick={() =>
                            handleDeleteProduct(product._id, product.name)
                          }
                          disabled={deleteMutation.isPending}
                          className="btn btn-ghost btn-xs border border-base-300 text-error hover:bg-error/15 hover:border-error font-medium inline-flex items-center gap-1 transition-colors cursor-pointer"
                          title="상품 삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>삭제</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={PackageSearch}
          title="등록된 상품이 없습니다"
          description="현재 카탈로그에 등록된 상품이 없거나 검색 조건에 맞는 결과가 존재하지 않습니다."
          actionLabel="첫번째 신규 상품 등록하기"
          onAction={handleOpenCreateModal}
        />
      )}

      {/* Modal */}
      <ProductModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSubmit={handleFormSubmit}
        initialData={editingProduct}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
};

export default ProductsPage;
