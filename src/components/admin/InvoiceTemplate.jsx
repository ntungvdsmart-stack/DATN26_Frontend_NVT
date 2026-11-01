import React, { forwardRef, useEffect, useState } from 'react';
import configApi from '../../api/configApi';

const InvoiceTemplate = forwardRef(({ order }, ref) => {
  const [store, setStore] = useState({});
  useEffect(() => { configApi.getSettings().then(result => setStore(result.data)).catch(() => {}); }, []);
  if (!order) return null;

  return (
    <div ref={ref} className="print-only-container hidden bg-white text-black text-sm font-mono mx-auto" style={{ width: '100%', maxWidth: '210mm', padding: '15px' }}>
      {/* 
        NOTE: Các CSS liên quan đến in ấn (.print-only-container, .print-hide)
        sẽ được thêm vào index.css
      */}
      
      {/* Header */}
      <div className="text-center border-b border-dashed border-gray-400 pb-3 mb-3">
        <h1 className="text-xl font-bold uppercase tracking-widest mb-1">{store.store_name || 'FashionOS'}</h1>
        {store.store_address && <p className="text-xs">{store.store_address}</p>}
        {store.store_phone && <p className="text-xs">SĐT: {store.store_phone}</p>}
        <h2 className="text-lg font-bold mt-2">HÓA ĐƠN BÁN HÀNG</h2>
      </div>

      {/* Thông tin đơn hàng */}
      <div className="mb-3 text-xs leading-relaxed">
        <div className="flex justify-between">
          <span>Mã ĐH:</span>
          <span className="font-bold">{order.order_code}</span>
        </div>
        <div className="flex justify-between">
          <span>Ngày in:</span>
          <span>{new Date().toLocaleString('vi-VN')}</span>
        </div>
        <div className="flex justify-between">
          <span>Khách hàng:</span>
          <span className="text-right max-w-[60%] truncate">{order.customer_name || 'Khách vãng lai'}</span>
        </div>
        {order.shipping_address_snapshot && (
          <div className="flex justify-between items-start mt-1">
            <span className="whitespace-nowrap mr-2">Địa chỉ:</span>
            <span className="text-right text-[10px]">{order.shipping_address_snapshot}</span>
          </div>
        )}
      </div>

      {/* Bảng sản phẩm */}
      <table className="w-full text-xs text-left mb-3">
        <thead className="border-b border-dashed border-gray-400">
          <tr>
            <th className="py-1 w-1/2">Sản phẩm</th>
            <th className="py-1 text-center w-1/6">SL</th>
            <th className="py-1 text-right w-1/3">T.Tiền</th>
          </tr>
        </thead>
        <tbody className="border-b border-dashed border-gray-400">
          {order.items?.map((item, idx) => (
            <tr key={idx} className="align-top">
              <td className="py-2 pr-1">
                <div className="font-bold">{item.product_name || `SP #${item.variant_id}`}</div>
                {(item.color_name || item.size_value) && (
                  <div className="text-[10px] text-gray-500">{item.color_name} {item.size_value && `| ${item.size_value}`}</div>
                )}
                <div className="text-[10px]">{Number(item.unit_price).toLocaleString('vi-VN')}đ</div>
              </td>
              <td className="py-2 text-center pt-2.5">{item.quantity}</td>
              <td className="py-2 text-right font-bold pt-2.5">
                {(Number(item.unit_price) * item.quantity).toLocaleString('vi-VN')}đ
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Tổng kết */}
      <div className="space-y-1 mb-4 text-xs">
        <div className="flex justify-between">
          <span>Tạm tính:</span>
          <span>{Number(order.subtotal_amount || 0).toLocaleString('vi-VN')}đ</span>
        </div>
        <div className="flex justify-between">
          <span>Giảm giá:</span>
          <span>{Number(order.discount_amount || 0).toLocaleString('vi-VN')}đ</span>
        </div>
        {Number(order.loyalty_discount) > 0 && <div className="flex justify-between"><span>Ưu đãi thành viên:</span><span>-{Number(order.loyalty_discount).toLocaleString('vi-VN')}đ</span></div>}
        {Number(order.shipping_fee) > 0 && <div className="flex justify-between"><span>Phí vận chuyển:</span><span>{Number(order.shipping_fee).toLocaleString('vi-VN')}đ</span></div>}
        <div className="flex justify-between font-bold text-sm mt-2 pt-2 border-t border-dashed border-gray-400">
          <span>TỔNG CỘNG:</span>
          <span>{Number(order.total_amount || 0).toLocaleString('vi-VN')}đ</span>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs mt-6">
        <p className="font-bold mb-1">CẢM ƠN QUÝ KHÁCH HẸN GẶP LẠI!</p>
        <p className="text-[10px]">Lưu ý: Hàng đổi trả trong vòng 30 ngày (còn nguyên tem mác)</p>
        <p className="text-[10px] mt-2">Powered by FashionOS</p>
      </div>
    </div>
  );
});

InvoiceTemplate.displayName = 'InvoiceTemplate';
export default InvoiceTemplate;
