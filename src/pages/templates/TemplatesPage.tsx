import React, { useState, useEffect, useRef } from 'react';

import TemplateSidebar from '../../components/templates/TemplateSidebar';
import TemplatePreviewCard from '../../components/templates/TemplatePreviewCard';
import { supabase } from '../../supabaseClient';



const TemplatesPage: React.FC = () => {
 
  const [activeTemplate, setActiveTemplate] = useState('Regular Payslips');
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [templates, setTemplates] = useState<any[]>([]);

useEffect(() => {
  const fetchTemplates = async () => {
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching templates:', error);
    } else {
      setTemplates(data);
    }
  };

  fetchTemplates();
}, []);

  // Close cards when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setSelectedCard(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="flex">
      {/* Sidebar */}
      {/* <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} /> */}

      {/* Main Content */}
      <div className="flex-1">
        {/* Header */}
        {/* <Header /> */}

        {/* Templates Section */}
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">Templates</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4" ref={containerRef}>
            {/* Left Sidebar */}
            <TemplateSidebar activeTemplate={activeTemplate} onSelect={setActiveTemplate} />

         {/* Right Section - Template Previews */}
<div className="md:col-span-2 h-125 bg-gray-100 rounded-lg p-6 flex justify-around flex-wrap gap-4">
  {templates
    .filter((tpl) => tpl.category === activeTemplate) // 👈 show only templates in selected category
    .map((tpl) => (
      <TemplatePreviewCard
        key={tpl.id}
        id={tpl.id}
        title={tpl.name}
        isDefault={tpl.is_default}
        isSelected={selectedCard === tpl.id}
        onSelect={() => setSelectedCard(tpl.id)}
        htmlContent={tpl.html_content}
      />
    ))}
</div>


          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplatesPage;

