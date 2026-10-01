import React, { useState, useEffect } from 'react';
import { getStories, createStory } from '../firebase/firestore.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { api } from '../services/api.js';
import { ArrowRight, Plus, Sparkles, BookOpen, Clock, Tag, X, User } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function StoriesPage() {
  const { currentUser } = useAuth();
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStory, setSelectedStory] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // New story form fields
  const [newTitle, setNewTitle] = useState('');
  const [newExcerpt, setNewExcerpt] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('Education & Tech');
  const [newCollege, setNewCollege] = useState(currentUser?.college || 'SRM Kattankulathur (KTR)');
  const [newProgramme, setNewProgramme] = useState('Digital Literacy Outreach');
  const [submitting, setSubmitting] = useState(false);
  const [filterCategory, setFilterCategory] = useState('All');

  const fetchStories = async () => {
    setLoading(true);
    try {
      const data = await getStories();
      setStories(data || []);
      if (!selectedStory && data && data.length > 0) {
        setSelectedStory(data[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStories();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) {
      alert('Please provide a title and story content.');
      return;
    }

    setSubmitting(true);
    try {
      await createStory({
        title: newTitle.trim(),
        excerpt: newExcerpt.trim() || newContent.trim().slice(0, 160) + '...',
        content: newContent.trim(),
        category: newCategory,
        authorName: currentUser?.name || 'Student Volunteer',
        authorRole: currentUser?.role === 'organization' ? 'Host Coordinator' : 'Collegiate Volunteer',
        college: currentUser?.college || newCollege,
        programme: newProgramme,
        city: currentUser?.homeCity || 'Chennai',
        coverImage: '/src/assets/images/hero_student_outreach_1790530832259.jpg'
      });

      setNewTitle('');
      setNewExcerpt('');
      setNewContent('');
      setShowAddModal(false);
      await fetchStories();
    } catch (err) {
      alert('Failed to publish story: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const categories = ['All', 'Education & Tech', 'Ecology & Environment', 'Urban Ecology', 'Healthcare'];

  const filteredStories = stories.filter(
    (s) => filterCategory === 'All' || s.category === filterCategory
  );

  return (
    <div className="bg-[#FBF9F5] min-h-screen py-10 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Editorial Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#0C3B2E]/10 mb-8">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.25em] text-[#FF5A1F] mb-1.5 font-display">
              Field Dispatches & Voices
            </div>
            <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-[#141C18] uppercase leading-tight">
              Sangam <span className="text-[#0C3B2E]">Stories & Dispatches</span>.
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-[#57655F] max-w-xl font-normal">
              Eyewitness dispatches, SRM campus squad reflections, and field impact journals written by students and host organizations.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-5 py-2.5 rounded bg-[#0C3B2E] hover:bg-[#07251D] text-white text-xs font-semibold transition-all inline-flex items-center gap-2 cursor-pointer shadow-sm active:scale-95"
            >
              <Plus className="w-4 h-4 text-[#F5A623]" />
              <span>Write a Story / Dispatch</span>
            </button>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 text-xs no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-4 py-2 rounded text-xs font-bold transition-all shrink-0 cursor-pointer ${
                filterCategory === cat
                  ? 'bg-[#0C3B2E] text-white shadow-xs'
                  : 'bg-transparent text-[#57655F] hover:text-[#141C18] border border-[#0C3B2E]/15'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Two-Column Editorial Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* Main Story Column */}
          <div className="lg:col-span-7 space-y-6">
            {selectedStory ? (
              <article className="border border-[#0C3B2E]/15 rounded-lg overflow-hidden bg-white p-6 sm:p-10 shadow-xs">
                {(selectedStory.coverImage || selectedStory.image) && (
                  <div className="h-64 sm:h-80 lg:h-96 w-full overflow-hidden rounded mb-6 bg-stone-200 shadow-2xs">
                    <img
                      src={selectedStory.coverImage || selectedStory.image}
                      alt={selectedStory.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#0C3B2E] uppercase tracking-wider mb-3">
                  <span className="text-[#FF5A1F]">{selectedStory.category}</span>
                  <span>·</span>
                  <span>{selectedStory.city || selectedStory.college}</span>
                  <span>·</span>
                  <span>{selectedStory.date}</span>
                </div>

                <h2 className="font-display text-2xl sm:text-4xl font-black text-[#141C18] uppercase tracking-tight leading-tight mb-4">
                  {selectedStory.title}
                </h2>

                <div className="flex items-center justify-between py-3 border-y border-[#0C3B2E]/10 mb-6 text-xs text-[#57655F]">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#0C3B2E] text-white font-bold flex items-center justify-center font-display text-sm">
                      {(selectedStory.authorName || 'SV').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-[#141C18] text-sm">{selectedStory.authorName}</div>
                      <div className="text-[11px]">
                        {selectedStory.college} {selectedStory.programme ? `· ${selectedStory.programme}` : ''}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const res = await api.post(`/stories/${selectedStory.id}/clap`);
                        if (res) {
                          setSelectedStory((prev) => ({ ...prev, claps: (prev.claps || 0) + 1 }));
                          setStories((prev) =>
                            prev.map((s) => (s.id === selectedStory.id ? { ...s, claps: (s.claps || 0) + 1 } : s))
                          );
                        }
                      } catch {
                        // local optimistic fallback
                        setSelectedStory((prev) => ({ ...prev, claps: (prev.claps || 0) + 1 }));
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#0C3B2E]/20 hover:border-[#FF5A1F] bg-[#FBF9F5] text-xs font-bold text-[#141C18] hover:text-[#FF5A1F] transition-all cursor-pointer shadow-2xs"
                  >
                    <span>👏</span>
                    <span>{selectedStory.claps || 0} claps</span>
                  </button>
                </div>

                <div className="prose prose-stone text-sm sm:text-base text-[#141C18] leading-relaxed whitespace-pre-line space-y-4 font-normal">
                  {selectedStory.content}
                </div>

                <div className="mt-8 pt-6 border-t border-[#0C3B2E]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <span className="text-xs font-mono text-[#57655F]">
                    Sangam Verified Field Record
                  </span>
                  <div className="flex items-center gap-4">
                    {selectedStory.opportunityId && (
                      <Link
                        to={`/opportunities/${selectedStory.opportunityId}`}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0C3B2E] hover:text-[#FF5A1F] transition-colors"
                      >
                        <span>View linked programme</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    )}
                    <Link
                      to="/browse"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#57655F] hover:text-[#0C3B2E] transition-colors"
                    >
                      <span>Find open programmes</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </article>
            ) : (
              <div className="text-center py-20 text-[#57655F]">
                No stories available in this category yet.
              </div>
            )}
          </div>

          {/* Sidebar: All Other Dispatches */}
          <div className="lg:col-span-5 space-y-4">
            <div className="text-xs font-bold uppercase tracking-wider text-[#0C3B2E] pb-2 border-b border-[#0C3B2E]/15 flex items-center justify-between">
              <span>All Field Dispatches</span>
              <span className="font-mono text-[#FF5A1F]">{filteredStories.length} Published</span>
            </div>

            <div className="divide-y divide-[#0C3B2E]/10">
              {filteredStories.map((story) => {
                const isSelected = selectedStory?.id === story.id;
                const storyImg = story.coverImage || story.image;
                return (
                  <div
                    key={story.id}
                    onClick={() => setSelectedStory(story)}
                    className={`py-3.5 px-3 rounded-lg transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#0C3B2E]/8 border-l-4 border-[#0C3B2E] shadow-2xs'
                        : 'hover:bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {storyImg && (
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded overflow-hidden shrink-0 bg-stone-200 border border-[#0C3B2E]/10">
                          <img
                            src={storyImg}
                            alt={story.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between text-[11px] text-[#57655F] mb-1">
                          <span className="font-bold text-[#FF5A1F] uppercase">{story.category}</span>
                          <span>{story.date}</span>
                        </div>

                        <h4 className="font-display text-sm sm:text-base font-bold text-[#141C18] hover:text-[#0C3B2E] transition-colors line-clamp-2 leading-snug">
                          {story.title}
                        </h4>

                        <p className="text-xs text-[#57655F] line-clamp-2 mt-1 leading-relaxed">
                          {story.excerpt}
                        </p>

                        <div className="mt-2 flex items-center justify-between text-[11px]">
                          <span className="text-[#0C3B2E] font-medium truncate">
                            By {story.authorName} ({story.college})
                          </span>
                          <span className="text-[#57655F] shrink-0">
                            👏 {story.claps || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

      {/* Add Story Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-lg border border-[#0C3B2E]/20 max-w-2xl w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-[#0C3B2E]/10 mb-6">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#FF5A1F]">
                  Author Dispatch
                </span>
                <h3 className="font-display text-2xl font-black text-[#141C18]">
                  Publish a Story or Blog
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-[#57655F] hover:text-[#141C18] p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#141C18] mb-1">
                  Story Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Teaching First Loops in North Chennai"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-transparent border border-[#0C3B2E]/20 rounded text-sm text-[#141C18] focus:outline-none focus:border-[#0C3B2E]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#141C18] mb-1">
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#0C3B2E]/20 rounded text-xs text-[#141C18] focus:outline-none"
                  >
                    <option value="Education & Tech">Education & Tech</option>
                    <option value="Ecology & Environment">Ecology & Environment</option>
                    <option value="Urban Ecology">Urban Ecology</option>
                    <option value="Healthcare">Healthcare</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#141C18] mb-1">
                    Associated Programme
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Digital Literacy Outreach"
                    value={newProgramme}
                    onChange={(e) => setNewProgramme(e.target.value)}
                    className="w-full px-3.5 py-2 bg-transparent border border-[#0C3B2E]/20 rounded text-xs text-[#141C18] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#141C18] mb-1">
                  Brief Excerpt / Hook
                </label>
                <input
                  type="text"
                  placeholder="One or two sentences summarizing your experience"
                  value={newExcerpt}
                  onChange={(e) => setNewExcerpt(e.target.value)}
                  className="w-full px-3.5 py-2 bg-transparent border border-[#0C3B2E]/20 rounded text-xs text-[#141C18] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#141C18] mb-1">
                  Full Story Content
                </label>
                <textarea
                  rows={6}
                  required
                  placeholder="Share what happened during the drive, how your collegiate squad worked together, challenges overcome, and the outcome..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-transparent border border-[#0C3B2E]/20 rounded text-sm text-[#141C18] focus:outline-none leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#0C3B2E]/10">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded text-xs font-semibold text-[#57655F] hover:text-[#141C18]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded bg-[#0C3B2E] hover:bg-[#07251D] text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Publishing...' : 'Publish Story'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
