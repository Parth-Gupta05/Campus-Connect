import React, { useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { all, createLowlight } from 'lowlight';
import axios from 'axios';
import 'highlight.js/styles/atom-one-dark.css';

import {
  FiBold,
  FiItalic,
  FiUnderline,
  FiList,
  FiCode,
  FiLink,
  FiImage,
  FiTerminal,
  FiRotateCcw,
  FiRotateCw,
  FiX,
  FiCheck,
  FiTrash2
} from 'react-icons/fi';
import { LuHeading1, LuHeading2, LuHeading3, LuQuote, LuListOrdered } from 'react-icons/lu';

// Initialize syntax highlighters
const lowlight = createLowlight(all);

export default function RichTextEditor({
  content,
  onChange,
  placeholder = 'Share your interview questions, rounds, DSA problems, tips, and overall experience...'
}) {
  const fileInputRef = useRef(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Custom Link Modal States
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false, // Replaced by CodeBlockLowlight
        heading: {
          levels: [1, 2, 3]
        }
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline font-medium hover:text-primary-container cursor-pointer transition-colors',
          target: '_blank',
          rel: 'noopener noreferrer'
        }
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-xl max-h-96 mx-auto my-4 border border-border-light shadow-md object-contain'
        }
      }),
      Placeholder.configure({
        placeholder
      }),
      CodeBlockLowlight.configure({
        lowlight,
        HTMLAttributes: {
          class: 'rounded-xl p-4 my-3 font-mono text-sm bg-[#282c34] text-[#abb2bf] overflow-x-auto shadow-inner border border-border-light/20'
        }
      })
    ],
    content: content || '',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose max-w-none min-h-[280px] p-4 md:p-6 text-on-surface focus:outline-none custom-scrollbar text-[15px] leading-relaxed'
      }
    }
  });

  if (!editor) {
    return null;
  }

  // Open custom link modal
  const openLinkModal = () => {
    const previousUrl = editor.getAttributes('link').href || '';
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to, ' ');

    setLinkUrl(previousUrl);
    setLinkText(selectedText || '');
    setShowLinkModal(true);
  };

  // Submit custom link modal
  const handleSaveLink = (e) => {
    e.preventDefault();
    if (!linkUrl.trim()) {
      // If empty URL, remove link
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      setShowLinkModal(false);
      return;
    }

    let finalUrl = linkUrl.trim();
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://') && !finalUrl.startsWith('mailto:')) {
      finalUrl = `https://${finalUrl}`;
    }

    const { from, to } = editor.state.selection;
    const hasSelection = from !== to;

    if (!hasSelection && linkText.trim()) {
      // Insert text with link
      editor
        .chain()
        .focus()
        .insertContent({
          type: 'text',
          text: linkText.trim(),
          marks: [{ type: 'link', attrs: { href: finalUrl } }]
        })
        .run();
    } else {
      // Apply link mark to current selection
      editor.chain().focus().extendMarkRange('link').setLink({ href: finalUrl }).run();
    }

    setShowLinkModal(false);
    setLinkUrl('');
    setLinkText('');
  };

  const handleRemoveLink = () => {
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
    setShowLinkModal(false);
    setLinkUrl('');
    setLinkText('');
  };

  // Upload image to Cloudinary & insert at cursor
  const handleInlineImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('image', file);
      const res = await axios.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data?.url) {
        editor.chain().focus().setImage({ src: res.data.url, alt: file.name }).run();
      }
    } catch (err) {
      console.error('Error uploading inline image:', err);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="relative border border-border-light rounded-2xl bg-surface-container-lowest shadow-sm focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
      {/* Sticky Editor Toolbar */}
      <div className="sticky top-0 z-30 flex flex-wrap items-center gap-1 p-2 bg-surface-container-low/95 backdrop-blur-md border-b border-border-light rounded-t-2xl text-on-surface-variant select-none shadow-2xs">
        {/* Headings */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`p-2 rounded-lg hover:bg-surface-variant transition-colors ${
            editor.isActive('heading', { level: 1 }) ? 'bg-primary text-on-primary font-bold shadow-sm' : ''
          }`}
          title="Heading 1"
        >
          <LuHeading1 className="text-base" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-2 rounded-lg hover:bg-surface-variant transition-colors ${
            editor.isActive('heading', { level: 2 }) ? 'bg-primary text-on-primary font-bold shadow-sm' : ''
          }`}
          title="Heading 2"
        >
          <LuHeading2 className="text-base" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`p-2 rounded-lg hover:bg-surface-variant transition-colors ${
            editor.isActive('heading', { level: 3 }) ? 'bg-primary text-on-primary font-bold shadow-sm' : ''
          }`}
          title="Heading 3"
        >
          <LuHeading3 className="text-base" />
        </button>

        <div className="w-[1px] h-5 bg-border-light mx-1" />

        {/* Text Formatting */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 rounded-lg hover:bg-surface-variant transition-colors ${
            editor.isActive('bold') ? 'bg-primary text-on-primary font-bold shadow-sm' : ''
          }`}
          title="Bold (Ctrl+B)"
        >
          <FiBold className="text-base" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 rounded-lg hover:bg-surface-variant transition-colors ${
            editor.isActive('italic') ? 'bg-primary text-on-primary font-bold shadow-sm' : ''
          }`}
          title="Italic (Ctrl+I)"
        >
          <FiItalic className="text-base" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-2 rounded-lg hover:bg-surface-variant transition-colors ${
            editor.isActive('underline') ? 'bg-primary text-on-primary font-bold shadow-sm' : ''
          }`}
          title="Underline (Ctrl+U)"
        >
          <FiUnderline className="text-base" />
        </button>

        <div className="w-[1px] h-5 bg-border-light mx-1" />

        {/* Lists & Quotes */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded-lg hover:bg-surface-variant transition-colors ${
            editor.isActive('bulletList') ? 'bg-primary text-on-primary font-bold shadow-sm' : ''
          }`}
          title="Bullet List"
        >
          <FiList className="text-base" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-2 rounded-lg hover:bg-surface-variant transition-colors ${
            editor.isActive('orderedList') ? 'bg-primary text-on-primary font-bold shadow-sm' : ''
          }`}
          title="Numbered List"
        >
          <LuListOrdered className="text-base" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-2 rounded-lg hover:bg-surface-variant transition-colors ${
            editor.isActive('blockquote') ? 'bg-primary text-on-primary font-bold shadow-sm' : ''
          }`}
          title="Quote"
        >
          <LuQuote className="text-base" />
        </button>

        <div className="w-[1px] h-5 bg-border-light mx-1" />

        {/* Code & Terminal */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={`p-2 rounded-lg hover:bg-surface-variant transition-colors ${
            editor.isActive('code') ? 'bg-primary text-on-primary font-bold shadow-sm' : ''
          }`}
          title="Inline Code"
        >
          <FiCode className="text-base" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={`p-2 rounded-lg hover:bg-surface-variant transition-colors ${
            editor.isActive('codeBlock') ? 'bg-primary text-on-primary font-bold shadow-sm' : ''
          }`}
          title="Code Block / Syntax Highlighting"
        >
          <FiTerminal className="text-base" />
        </button>

        <div className="w-[1px] h-5 bg-border-light mx-1" />

        {/* Custom Links & Images */}
        <button
          type="button"
          onClick={openLinkModal}
          className={`p-2 rounded-lg hover:bg-surface-variant transition-colors ${
            editor.isActive('link') ? 'bg-primary text-on-primary font-bold shadow-sm' : ''
          }`}
          title="Insert Link"
        >
          <FiLink className="text-base" />
        </button>
        <label
          className={`p-2 rounded-lg hover:bg-surface-variant cursor-pointer transition-colors flex items-center ${
            uploadingImage ? 'opacity-50 pointer-events-none' : ''
          }`}
          title="Insert Inline Image Between Paragraphs"
        >
          {uploadingImage ? (
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <FiImage className="text-base" />
          )}
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            className="hidden"
            onChange={handleInlineImageUpload}
          />
        </label>

        {/* History */}
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="p-2 rounded-lg hover:bg-surface-variant transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Undo"
          >
            <FiRotateCcw className="text-sm" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="p-2 rounded-lg hover:bg-surface-variant transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Redo"
          >
            <FiRotateCw className="text-sm" />
          </button>
        </div>
      </div>

      {/* Editor Main Canvas */}
      <EditorContent editor={editor} />

      {/* Word and Character Count Footer */}
      <div className="px-4 py-2 bg-surface-container-low/60 border-t border-border-light rounded-b-2xl flex justify-between items-center text-xs text-on-surface-variant/70">
        <span>Tip: Use Markdown shortcuts (e.g. # for H1, ``` for code, &gt; for quote)</span>
        <span className="font-mono">
          {editor.getText().length} / 50,000 chars
        </span>
      </div>

      {/* Custom Link Insertion Modal */}
      {showLinkModal && (
        <div
          onClick={() => setShowLinkModal(false)}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-surface-container-lowest border border-border-light rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between border-b border-border-light pb-3">
              <h3 className="font-bold text-base text-on-surface flex items-center gap-2">
                <FiLink className="text-primary" /> {editor.isActive('link') ? 'Edit Link' : 'Insert Link'}
              </h3>
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
                className="p-1 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-variant transition-colors"
              >
                <FiX className="text-base" />
              </button>
            </div>

            <form onSubmit={handleSaveLink} className="space-y-4">
              {/* Optional Link Text if no selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                  Link Text (Optional)
                </label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="e.g. LeetCode Problem 42"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border-light bg-surface-container-low text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-2xs"
                />
              </div>

              {/* URL */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                  Web Address (URL) *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://leetcode.com/problems/..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border-light bg-surface-container-low text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-2xs font-mono"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-2">
                {editor.isActive('link') ? (
                  <button
                    type="button"
                    onClick={handleRemoveLink}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-error/10 text-error hover:bg-error/20 text-xs font-bold transition-colors cursor-pointer"
                  >
                    <FiTrash2 className="text-sm" /> Remove Link
                  </button>
                ) : <div />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowLinkModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface-variant transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-primary text-on-primary hover:bg-on-primary-fixed text-xs font-bold transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <FiCheck className="text-sm" /> Save Link
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
