// src/App.jsx
import { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';

function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  // Lấy danh sách sản phẩm từ Firestore
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, "products"));
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(data);
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu: ", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Hàm thêm dữ liệu mẫu khớp đúng cấu trúc của bạn lên Firestore
  // Hàm thêm dữ liệu mẫu khớp đúng cấu trúc của bạn lên Firestore
  const handleAddSample = async () => {
    try {
      setAdding(true);
      console.log("Đang gửi dữ liệu lên Firebase...");
      
      const docRef = await addDoc(collection(db, "products"), {
        categoryId: "cat_ao",
        createdAt: serverTimestamp(),
        description: "Áo thun form rộng phong cách casual",
        images: ["image 1", "image 2"],
        name: "Oversized T-Shirt",
        price: 299000,
        status: "active",
        variants: [
          { color: "black", size: "M", stock: 10 },
          { color: "red", size: "S", stock: 10 }
        ]
      });
      
      console.log("Thêm thành công với ID: ", docRef.id);
      alert("Thêm sản phẩm thành công!");
      await fetchProducts(); // Tải lại danh sách ngay sau khi thêm
    } catch (error) {
      console.error("Lỗi chi tiết khi thêm sản phẩm mẫu: ", error);
      alert("Lỗi: " + error.message); // Hiển thị popup lỗi trực tiếp lên web để bạn thấy
    } finally {
      setAdding(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '30px auto', fontFamily: 'Arial, sans-serif', padding: '20px' }}>
      <h2 style={{ textAlign: 'center', color: '#333' }}>Danh Sách Sản Phẩm Từ Firebase</h2>

      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <button 
          onClick={handleAddSample} 
          disabled={adding}
          style={{ padding: '10px 20px', backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '15px' }}
        >
          {adding ? 'Đang thêm...' : '+ Thêm sản phẩm mẫu (Khớp cấu trúc)'}
        </button>
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', color: '#666' }}>Đang tải dữ liệu...</p>
      ) : products.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#666' }}>Không có sản phẩm nào trên Firebase. Hãy bấm nút phía trên để tạo dữ liệu test!</p>
      ) : (
        <div style={{ display: 'grid', gap: '15px' }}>
          {products.map((product) => (
            <div key={product.id} style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: '0 0 8px 0', color: '#0070f3' }}>{product.name}</h3>
                <span style={{ fontSize: '12px', background: '#e1e1e1', padding: '3px 8px', borderRadius: '4px' }}>
                  {product.categoryId}
                </span>
              </div>
              
              <p style={{ margin: '5px 0', color: '#555' }}><strong>Mô tả:</strong> {product.description}</p>
              <p style={{ margin: '5px 0', color: '#d9534f', fontWeight: 'bold' }}>
                Giá: {product.price?.toLocaleString('vi-VN')} đ
              </p>
              <p style={{ margin: '5px 0' }}><strong>Trạng thái:</strong> <span style={{ color: product.status === 'active' ? 'green' : 'orange' }}>{product.status}</span></p>

              {/* Hiển thị chi tiết biến thể (variants) */}
              {product.variants && product.variants.length > 0 && (
                <div style={{ marginTop: '10px', background: '#fff', padding: '10px', borderRadius: '5px', border: '1px solid #eee' }}>
                  <strong style={{ fontSize: '13px' }}>Biến thể (Variants):</strong>
                  <ul style={{ margin: '5px 0 0 20px', padding: 0 }}>
                    {product.variants.map((v, index) => (
                      <li key={index} style={{ fontSize: '13px', color: '#444' }}>
                        Màu: <b>{v.color}</b> | Size: <b>{v.size}</b> | Tồn kho: <b>{v.stock}</b>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;