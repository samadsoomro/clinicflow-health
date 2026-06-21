import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const PatientStoriesEditor = ({ clinicId }: { clinicId: string }) => {
  const [reviewsSectionEnabled, setReviewsSectionEnabled] = useState(false);
  const [reviewsTitle, setReviewsTitle] = useState('');
  const [reviewsSubtitle, setReviewsSubtitle] = useState('');
  const [reviews, setReviews] = useState<any[]>([]);
  const [newReview, setNewReview] = useState({
    reviewer_name: '', review_text: '', time_ago: '', rating: 5, tags_input: ''
  });
  const [loading, setLoading] = useState(true);

  const fetchReviews = async () => {
    const { data } = await supabase
      .from('clinic_reviews')
      .select('*')
      .eq('clinic_id', clinicId)
      .order('display_order', { ascending: true });
    setReviews(data || []);
  };

  const fetchSettings = async () => {
    const { data } = await supabase
      .from('clinics')
      .select('reviews_section_enabled, reviews_section_title, reviews_section_subtitle')
      .eq('id', clinicId)
      .single();
    
    if (data) {
      setReviewsSectionEnabled(data.reviews_section_enabled || false);
      setReviewsTitle(data.reviews_section_title || '');
      setReviewsSubtitle(data.reviews_section_subtitle || '');
    }
  };

  useEffect(() => {
    if (clinicId) {
      Promise.all([fetchReviews(), fetchSettings()]).finally(() => setLoading(false));
    }
  }, [clinicId]);

  const handleAddReview = async () => {
    if (!newReview.reviewer_name || !newReview.review_text) return;
    const tags = newReview.tags_input.split(',').map(t => t.trim()).filter(Boolean);
    await supabase.from('clinic_reviews').insert({
      clinic_id: clinicId,
      reviewer_name: newReview.reviewer_name,
      review_text: newReview.review_text,
      time_ago: newReview.time_ago || null,
      rating: newReview.rating,
      tags,
      display_order: reviews.length,
      is_active: true,
    });
    setNewReview({ reviewer_name: '', review_text: '', time_ago: '', rating: 5, tags_input: '' });
    await fetchReviews();
    toast.success('Review added');
  };

  const handleDeleteReview = async (id: string) => {
    await supabase.from('clinic_reviews').delete().eq('id', id);
    await fetchReviews();
    toast.success('Review deleted');
  };

  const handleToggleReview = async (id: string, isActive: boolean) => {
    await supabase.from('clinic_reviews').update({ is_active: isActive }).eq('id', id);
    await fetchReviews();
    toast.success(isActive ? 'Review set to visible' : 'Review hidden');
  };

  const handleMoveReview = async (id: string, direction: 'up' | 'down') => {
    const index = reviews.findIndex(r => r.id === id);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === reviews.length - 1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const currentReview = reviews[index];
    const swapReview = reviews[newIndex];

    const newReviews = [...reviews];
    newReviews[index] = swapReview;
    newReviews[newIndex] = currentReview;
    setReviews(newReviews);

    await supabase.from('clinic_reviews').update({ display_order: newIndex }).eq('id', currentReview.id);
    await supabase.from('clinic_reviews').update({ display_order: index }).eq('id', swapReview.id);
  };

  if (loading) {
    return <div className="p-4 text-center">Loading settings...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Section toggle */}
      <div className="flex items-center justify-between p-4 border rounded-xl mb-4 bg-white dark:bg-gray-800">
        <div>
          <h3 className="font-semibold text-foreground">Patient Stories Section</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Show Google reviews on your homepage</p>
        </div>
        <input
          type="checkbox"
          checked={reviewsSectionEnabled}
          onChange={async (e) => {
            const checked = e.target.checked;
            setReviewsSectionEnabled(checked);
            await supabase.from('clinics').update({ reviews_section_enabled: checked }).eq('id', clinicId);
            toast.success(checked ? 'Section enabled' : 'Section disabled');
          }}
          className="w-5 h-5 accent-primary"
        />
      </div>

      {reviewsSectionEnabled && (
        <>
          {/* Section heading customization */}
          <div className="space-y-3 mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border">
            <div>
              <label className="text-sm font-medium block mb-1 text-foreground">Section Title</label>
              <input
                type="text"
                value={reviewsTitle}
                onChange={(e) => setReviewsTitle(e.target.value)}
                onBlur={async () => {
                  await supabase.from('clinics').update({ reviews_section_title: reviewsTitle || null }).eq('id', clinicId);
                }}
                placeholder="Default: Patient Stories"
                className="w-full border rounded-lg px-3 py-2 text-sm bg-background text-foreground"
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1 text-foreground">Section Subtitle</label>
              <input
                type="text"
                value={reviewsSubtitle}
                onChange={(e) => setReviewsSubtitle(e.target.value)}
                onBlur={async () => {
                  await supabase.from('clinics').update({ reviews_section_subtitle: reviewsSubtitle || null }).eq('id', clinicId);
                }}
                placeholder="Default: Verified 5-Star Feedback"
                className="w-full border rounded-lg px-3 py-2 text-sm bg-background text-foreground"
              />
            </div>
          </div>

          {/* Add new review form */}
          <div className="p-4 border-2 border-dashed border-blue-200 dark:border-blue-900/50 rounded-xl mb-4 bg-blue-50/50 dark:bg-blue-900/10">
            <h4 className="font-medium text-sm mb-3 text-foreground">➕ Add New Review</h4>
            <div className="space-y-3">
              <input
                type="text"
                value={newReview.reviewer_name}
                onChange={(e) => setNewReview({...newReview, reviewer_name: e.target.value})}
                placeholder="Reviewer Name *"
                className="w-full border rounded-lg px-3 py-2 text-sm bg-background text-foreground"
              />
              <textarea
                value={newReview.review_text}
                onChange={(e) => setNewReview({...newReview, review_text: e.target.value})}
                placeholder="Review text * (paste from Google Maps)"
                rows={3}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-background text-foreground"
              />
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newReview.time_ago}
                  onChange={(e) => setNewReview({...newReview, time_ago: e.target.value})}
                  placeholder="Time (e.g. 2 weeks ago)"
                  className="flex-1 border rounded-lg px-3 py-2 text-sm bg-background text-foreground"
                />
                <select
                  value={newReview.rating}
                  onChange={(e) => setNewReview({...newReview, rating: Number(e.target.value)})}
                  className="border rounded-lg px-3 py-2 text-sm bg-background text-foreground"
                >
                  {[5,4,3,2,1].map(r => <option key={r} value={r}>{r} Stars</option>)}
                </select>
              </div>
              <input
                type="text"
                value={newReview.tags_input}
                onChange={(e) => setNewReview({...newReview, tags_input: e.target.value})}
                placeholder="Tags (comma separated) e.g. Effective treatment, Hygiene"
                className="w-full border rounded-lg px-3 py-2 text-sm bg-background text-foreground"
              />
              <button
                onClick={handleAddReview}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold w-full transition-colors"
              >
                Add Review
              </button>
            </div>
          </div>

          {/* Existing reviews list */}
          <div className="space-y-3">
            {reviews.map((review, index) => (
              <div key={review.id} className="flex items-start gap-3 p-3 border rounded-xl bg-white dark:bg-gray-800">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-foreground">{review.reviewer_name}</span>
                    <span className="text-xs text-muted-foreground">{review.time_ago}</span>
                    <span className="text-yellow-400 text-xs">{'⭐'.repeat(review.rating)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{review.review_text}</p>
                  {review.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {review.tags.map((tag: string) => (
                        <span key={tag} className="text-xs bg-gray-100 dark:bg-gray-700 text-foreground px-2 py-0.5 rounded-full">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 flex-shrink-0 items-center">
                  {/* Move up */}
                  <button onClick={() => handleMoveReview(review.id, 'up')} disabled={index === 0} className="text-gray-400 hover:text-foreground p-1 disabled:opacity-30">↑</button>
                  {/* Move down */}
                  <button onClick={() => handleMoveReview(review.id, 'down')} disabled={index === reviews.length - 1} className="text-gray-400 hover:text-foreground p-1 disabled:opacity-30">↓</button>
                  {/* Toggle active */}
                  <button
                    onClick={() => handleToggleReview(review.id, !review.is_active)}
                    className={`text-xs px-2 py-1 rounded transition-colors ${review.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}
                  >
                    {review.is_active ? 'Visible' : 'Hidden'}
                  </button>
                  {/* Delete */}
                  <button onClick={() => handleDeleteReview(review.id)} className="text-red-400 hover:text-red-600 p-1">🗑</button>
                </div>
              </div>
            ))}
            {reviews.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No reviews added yet. Add one above to display on your homepage.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
};
