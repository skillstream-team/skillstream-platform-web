import React, { useRef, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Image, Upload } from 'lucide-react';
import { apiService } from '../../services/api';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Start typing...',
  height = '200px'
}) => {
  const quillRef = useRef<ReactQuill>(null);
  
  // Ensure editor is focusable and interactive
  useEffect(() => {
    if (quillRef.current) {
      const editor = quillRef.current.getEditor();
      if (editor) {
        // Make sure the editor container is interactive
        const container = editor.container;
        if (container) {
          container.style.pointerEvents = 'auto';
          container.style.cursor = 'text';
          // Ensure the editor root is also interactive
          const root = container.querySelector('.ql-editor') as HTMLElement;
          if (root) {
            root.style.pointerEvents = 'auto';
            root.style.cursor = 'text';
            root.setAttribute('contenteditable', 'true');
          }
        }
      }
    }
  }, [value]); // Re-run when value changes to ensure editor is ready

  const imageHandler = async () => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      try {
        // Upload image
        const uploadedFile = await apiService.uploadFile(file, 'course-content', {});
        
        // Get quill instance
        const quill = quillRef.current?.getEditor();
        if (!quill) return;

        // Get cursor position
        const range = quill.getSelection(true);
        
        // Insert image at cursor position
        quill.insertEmbed(range.index, 'image', uploadedFile.url);
        quill.setSelection(range.index + 1);
      } catch (error) {
        console.error('Error uploading image:', error);
        alert('Failed to upload image. Please try again.');
      }
    };
  };

  const modules = {
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        [{ 'font': [] }],
        [{ 'size': [] }],
        ['bold', 'italic', 'underline', 'strike', 'blockquote'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }, { 'indent': '-1'}, { 'indent': '+1' }],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'align': [] }],
        ['link', 'image', 'video'],
        ['clean']
      ],
      handlers: {
        image: imageHandler
      }
    },
    clipboard: {
      matchVisual: false
    }
  };

  const formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet', 'indent',
    'color', 'background', 'align',
    'link', 'image', 'video'
  ];

  return (
    <div 
      style={{ 
        height, 
        position: 'relative', 
        zIndex: 200,
        pointerEvents: 'auto'
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        style={{
          height: `calc(${height} - 42px)`,
          backgroundColor: 'white',
          pointerEvents: 'auto'
        }}
      />
      <style>{`
        .ql-container {
          font-size: 16px;
          color: #0B1E3F;
          pointer-events: auto !important;
          position: relative !important;
        }
        .ql-editor {
          min-height: 150px;
          pointer-events: auto !important;
          cursor: text !important;
        }
        .ql-editor:focus {
          outline: none;
        }
        .ql-editor.ql-blank::before {
          color: #9CA3AF;
          font-style: normal;
        }
        .ql-toolbar {
          border-top-left-radius: 12px;
          border-top-right-radius: 12px;
          border-color: #E5E7EB;
          pointer-events: auto !important;
          z-index: 200 !important;
        }
        .ql-container {
          border-bottom-left-radius: 12px;
          border-bottom-right-radius: 12px;
          border-color: #E5E7EB;
        }
        .ql-toolbar .ql-stroke {
          stroke: #6F73D2;
        }
        .ql-toolbar .ql-fill {
          fill: #6F73D2;
        }
        .ql-toolbar button:hover,
        .ql-toolbar button.ql-active {
          color: #00B5AD;
        }
        .ql-toolbar button:hover .ql-stroke,
        .ql-toolbar button.ql-active .ql-stroke {
          stroke: #00B5AD;
        }
        .ql-toolbar button:hover .ql-fill,
        .ql-toolbar button.ql-active .ql-fill {
          fill: #00B5AD;
        }
        .ql-toolbar button {
          pointer-events: auto !important;
        }
        .ql-snow .ql-picker {
          pointer-events: auto !important;
          z-index: 300 !important;
        }
        .ql-snow .ql-picker-options {
          z-index: 300 !important;
        }
        .ql-snow .ql-picker-label {
          pointer-events: auto !important;
        }
      `}</style>
    </div>
  );
};

