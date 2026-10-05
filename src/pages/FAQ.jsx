import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, ChevronDown, Loader2 } from 'lucide-react';
import faqApi from '../api/faqApi';

const FAQ = () => {
  const [faqs, setFaqs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openIndex, setOpenIndex] = useState(null);

  useEffect(() => {
    faqApi.getActive().then(res => {
      if (res?.success) setFaqs(res.data);
      setIsLoading(false);
    }).catch(() => setIsLoading(false));
  }, []);

  return (
    <div className="bg-background min-h-screen pt-10 pb-20">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="text-center mb-12">
          <HelpCircle className="w-16 h-16 mx-auto mb-6 text-primary" />
          <h1 className="text-4xl font-black uppercase tracking-tight mb-4">Câu Hỏi Thường Gặp</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Tìm câu trả lời cho các thắc mắc về mua sắm, thanh toán, giao hàng và chính sách đổi trả tại FashionOS.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>
        ) : (
          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = openIndex === index;
              return (
                <div key={faq.faq_id} className="border border-border rounded-2xl overflow-hidden bg-card transition-all hover:border-primary/50">
                  <button 
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    className="w-full flex items-center justify-between p-6 text-left focus:outline-none"
                  >
                    <span className="font-bold text-lg pr-4">{faq.question}</span>
                    <ChevronDown className={`w-5 h-5 text-primary shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                      >
                        <div className="p-6 pt-0 text-muted-foreground whitespace-pre-line leading-relaxed">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
            {faqs.length === 0 && (
              <p className="text-center text-muted-foreground py-10">Hiện chưa có câu hỏi nào.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FAQ;
