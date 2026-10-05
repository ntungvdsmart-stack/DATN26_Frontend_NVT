import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, CheckCircle2, XCircle, Search, HelpCircle, Loader2 } from 'lucide-react';
import faqApi from '../api/faqApi';
import { toast } from 'sonner';

const FaqManagement = () => {
  const [faqs, setFaqs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null);
  const [formData, setFormData] = useState({ question: '', answer: '', is_active: 1 });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchFaqs = async () => {
    setIsLoading(true);
    try {
      const res = await faqApi.getAll();
      if (res?.success) setFaqs(res.data);
    } catch (err) {
      toast.error('Lỗi tải danh sách FAQ');
    }
    setIsLoading(false);
  };

  useEffect(() => { fetchFaqs(); }, []);

  const openModal = (faq = null) => {
    if (faq) {
      setEditingFaq(faq);
      setFormData({ question: faq.question, answer: faq.answer, is_active: faq.is_active });
    } else {
      setEditingFaq(null);
      setFormData({ question: '', answer: '', is_active: 1 });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingFaq) {
        await faqApi.update(editingFaq.faq_id, formData);
        toast.success('Cập nhật FAQ thành công');
      } else {
        await faqApi.create(formData);
        toast.success('Thêm FAQ thành công');
      }
      setIsModalOpen(false);
      fetchFaqs();
    } catch (err) {
      toast.error('Có lỗi xảy ra');
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc muốn xóa câu hỏi này?')) {
      try {
        await faqApi.remove(id);
        toast.success('Xóa FAQ thành công');
        fetchFaqs();
      } catch (err) {
        toast.error('Lỗi khi xóa');
      }
    }
  };

  const handleToggleActive = async (faq) => {
    try {
      await faqApi.update(faq.faq_id, { ...faq, is_active: faq.is_active ? 0 : 1 });
      fetchFaqs();
    } catch (err) {
      toast.error('Lỗi cập nhật trạng thái');
    }
  };

  const filteredFaqs = faqs.filter(f => f.question.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="p-8 space-y-8 min-h-screen bg-background/50">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <HelpCircle className="w-8 h-8 text-primary" />
            Câu Hỏi Thường Gặp (FAQ)
          </h1>
          <p className="text-muted-foreground mt-1">Quản lý các câu hỏi trợ giúp cho khách hàng</p>
        </div>
        <button onClick={() => openModal()} className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:opacity-90">
          <Plus className="w-5 h-5" /> Thêm FAQ
        </button>
      </div>

      <div className="glass-panel p-4 rounded-2xl flex gap-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input 
            type="text" placeholder="Tìm kiếm câu hỏi..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl focus:border-primary outline-none"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredFaqs.map(faq => (
            <div key={faq.faq_id} className="glass-panel p-5 rounded-2xl flex justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-bold">{faq.question}</h3>
                  <button onClick={() => handleToggleActive(faq)} className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${faq.is_active ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}`}>
                    {faq.is_active ? 'Hiển thị' : 'Đang ẩn'}
                  </button>
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-line">{faq.answer}</p>
              </div>
              <div className="flex gap-2 items-start shrink-0">
                <button onClick={() => openModal(faq)} className="p-2 bg-blue-500/10 text-blue-600 rounded-lg hover:bg-blue-500/20"><Edit2 size={18} /></button>
                <button onClick={() => handleDelete(faq.faq_id)} className="p-2 bg-red-500/10 text-red-600 rounded-lg hover:bg-red-500/20"><Trash2 size={18} /></button>
              </div>
            </div>
          ))}
          {filteredFaqs.length === 0 && <p className="text-center text-muted-foreground py-10">Không tìm thấy câu hỏi nào</p>}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-background w-full max-w-2xl rounded-2xl p-6 shadow-2xl relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute right-4 top-4 text-muted-foreground"><XCircle size={24} /></button>
            <h2 className="text-xl font-bold mb-6">{editingFaq ? 'Sửa Câu Hỏi' : 'Thêm Câu Hỏi Mới'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground block mb-2">Câu hỏi *</label>
                <input required type="text" value={formData.question} onChange={e => setFormData(p => ({...p, question: e.target.value}))} className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground block mb-2">Câu trả lời *</label>
                <textarea required rows={5} value={formData.answer} onChange={e => setFormData(p => ({...p, answer: e.target.value}))} className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl outline-none focus:border-primary resize-none" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={formData.is_active} onChange={e => setFormData(p => ({...p, is_active: e.target.checked ? 1 : 0}))} className="w-5 h-5 accent-primary" />
                <span className="font-medium">Hiển thị cho khách hàng</span>
              </label>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 font-bold text-muted-foreground">Hủy</button>
                <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 font-bold bg-primary text-primary-foreground rounded-xl disabled:opacity-50 flex items-center gap-2">
                  {isSubmitting && <Loader2 size={16} className="animate-spin" />} Lưu
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default FaqManagement;
