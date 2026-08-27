import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Store, Shield, CreditCard, Mail, Bell, Globe, Save } from 'lucide-react';
import { cn } from '../lib/utils';

const SystemConfig = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => setIsSaving(false), 800);
  };

  const tabs = [
    { id: 'general', icon: Store, label: 'Thông tin chung' },
    { id: 'payment', icon: CreditCard, label: 'Thanh toán & Thuế' },
    { id: 'email', icon: Mail, label: 'Email & SMS' },
    { id: 'security', icon: Shield, label: 'Bảo mật' },
    { id: 'localization', icon: Globe, label: 'Khu vực & Ngôn ngữ' },
    { id: 'notifications', icon: Bell, label: 'Thông báo' },
  ];

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cài đặt hệ thống</h1>
          <p className="text-muted-foreground text-sm mt-1">Cấu hình toàn cầu cho FashionOS</p>
        </div>
        <button 
          onClick={handleSave}
          className="flex items-center justify-center gap-2 px-6 py-2 bg-foreground text-background rounded-lg text-sm font-bold hover:bg-foreground/90 transition-all w-full sm:w-auto"
        >
          {isSaving ? (
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
              <Settings size={16} />
            </motion.div>
          ) : (
            <Save size={16} />
          )}
          {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <div className="w-full lg:w-64 flex-shrink-0">
          <div className="flex flex-row lg:flex-col gap-1 overflow-x-auto scrollbar-none pb-2 lg:pb-0">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all whitespace-nowrap',
                    isActive ? 'bg-foreground text-background shadow-sm' : 'hover:bg-muted text-muted-foreground'
                  )}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm min-h-[500px]">
          <AnimatePresence mode="wait">
            {activeTab === 'general' && (
              <motion.div key="general" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="space-y-8">
                <div>
                  <h3 className="text-lg font-bold mb-4">Thông tin cửa hàng</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Tên cửa hàng</label>
                      <input type="text" defaultValue="FashionOS" className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-sm outline-none focus:border-primary transition-colors" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Hotline</label>
                      <input type="text" defaultValue="1900 1234" className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-sm outline-none focus:border-primary transition-colors" />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Email liên hệ</label>
                      <input type="email" defaultValue="support@fashionos.com" className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-sm outline-none focus:border-primary transition-colors" />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Địa chỉ trụ sở</label>
                      <input type="text" defaultValue="123 Nguyễn Văn Linh, Quận 7, TP. Hồ Chí Minh" className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-sm outline-none focus:border-primary transition-colors" />
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-border">
                  <h3 className="text-lg font-bold mb-4">Mạng xã hội</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Facebook URL</label>
                      <input type="text" defaultValue="https://facebook.com/fashionos" className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-sm outline-none focus:border-primary transition-colors" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Instagram URL</label>
                      <input type="text" defaultValue="https://instagram.com/fashionos" className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-sm outline-none focus:border-primary transition-colors" />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'payment' && (
              <motion.div key="payment" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="space-y-8">
                <div>
                  <h3 className="text-lg font-bold mb-4">Cổng thanh toán</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-border rounded-xl bg-background">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-8 bg-blue-500 rounded flex items-center justify-center text-white text-[10px] font-bold">VNPAY</div>
                        <div>
                          <p className="font-bold text-sm">VNPay Gateway</p>
                          <p className="text-xs text-muted-foreground">Thanh toán qua thẻ ATM, Visa, MasterCard</p>
                        </div>
                      </div>
                      <div className="w-10 h-6 bg-emerald-500 rounded-full flex items-center p-1 cursor-pointer">
                        <div className="w-4 h-4 bg-white rounded-full translate-x-4 shadow-sm" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 border border-border rounded-xl bg-background">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-8 bg-pink-500 rounded flex items-center justify-center text-white text-[10px] font-bold">MOMO</div>
                        <div>
                          <p className="font-bold text-sm">Ví MoMo</p>
                          <p className="text-xs text-muted-foreground">Thanh toán qua ví điện tử MoMo</p>
                        </div>
                      </div>
                      <div className="w-10 h-6 bg-emerald-500 rounded-full flex items-center p-1 cursor-pointer">
                        <div className="w-4 h-4 bg-white rounded-full translate-x-4 shadow-sm" />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="pt-6 border-t border-border">
                  <h3 className="text-lg font-bold mb-4">Cấu hình Thuế (VAT)</h3>
                  <div className="flex items-center justify-between p-4 border border-border rounded-xl bg-background mb-4">
                    <div>
                      <p className="font-bold text-sm">Bao gồm thuế trong giá sản phẩm</p>
                      <p className="text-xs text-muted-foreground">Tính giá đã bao gồm VAT trên toàn hệ thống</p>
                    </div>
                    <div className="w-10 h-6 bg-emerald-500 rounded-full flex items-center p-1 cursor-pointer">
                      <div className="w-4 h-4 bg-white rounded-full translate-x-4 shadow-sm" />
                    </div>
                  </div>
                  <div className="space-y-2 max-w-xs">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Phần trăm thuế (%)</label>
                    <input type="number" defaultValue="10" className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-sm outline-none focus:border-primary transition-colors" />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Other tabs placeholder */}
            {['email', 'security', 'localization', 'notifications'].includes(activeTab) && (
              <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="flex flex-col items-center justify-center h-full min-h-[400px] text-center text-muted-foreground">
                <Settings size={48} className="mb-4 opacity-20" />
                <h3 className="text-lg font-bold text-foreground mb-2">Đang phát triển module này</h3>
                <p className="text-sm max-w-sm">Các cấu hình này đang được bộ phận kỹ thuật hoàn thiện và sẽ cập nhật trong phiên bản tiếp theo.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default SystemConfig;
