import { toggleAvailability, getMenuItems } from '../api/menuApi';
import { getReviews, createReview } from '../api/reviewApi';
import { useMenu } from '../context/MenuContext';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Tooltip from './Tooltip';

const TAG_LABELS = {
  'seasonal':     { label: 'Seasonal', icon: '🍃' },
  'chef-special': { label: "Chef's Special", icon: '👨‍🍳' },
  'popular':      { label: 'Popular', icon: '⭐' },
  'new':          { label: 'New', icon: '✨' },
  'spicy':        { label: 'Spicy', icon: '🌶️' }
};
const renderStars = (rating = 0) => {
  const full = Math.round(rating);
  return '★★★★★'.slice(0, full) + '☆☆☆☆☆'.slice(0, 5 - full);
};

const energyBand = (calories) => {
  if (calories == null) return null;
  if (calories < 250) return 'Light';
  if (calories <= 450) return 'Moderate';
  return 'Heavy';
};

const Stars = ({ rating }) => (
  <div className="stars-inline">
    {[1, 2, 3, 4, 5].map((s) => (
      <span key={s} className={s <= rating ? 'star-filled' : 'star-empty'}>★</span>
    ))}
  </div>
);

const MenuCard = ({ item }) => {
  const { updateItem } = useMenu();
  const { user } = useAuth();

  const [toggling, setToggling] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [dishReviews, setDishReviews] = useState([]);
  const [relatedItems, setRelatedItems] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Dynamic rating state
  const [avgRating, setAvgRating] = useState(item.averageRating || 0);
  const [revCount, setRevCount] = useState(item.reviewCount || 0);

  // Review submission state
  const [newRating, setNewRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');

  const isAdmin = user?.role === 'admin';
  const itemId = item._id || item.id;

  // Sync state if prop changes
  useEffect(() => {
    if (item.averageRating !== undefined) setAvgRating(item.averageRating);
    if (item.reviewCount !== undefined) setRevCount(item.reviewCount);
  }, [item.averageRating, item.reviewCount]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const loadDishDetails = useCallback(async () => {
    setLoadingDetails(true);
    try {
      const [{ data: reviewData }, { data: menuData }] = await Promise.all([
        getReviews({ menuItem: itemId }),
        getMenuItems({ category: item.category })
      ]);

      const reviewsList = reviewData.data || [];
      setDishReviews(reviewsList);

      if (reviewsList.length > 0) {
        const sum = reviewsList.reduce((acc, r) => acc + (r.rating || 0), 0);
        const calcAvg = Number((sum / reviewsList.length).toFixed(1));
        setAvgRating(calcAvg);
        setRevCount(reviewsList.length);
      }

      const related = (menuData.data || [])
        .filter((menuItem) => (menuItem._id || menuItem.id) !== itemId && menuItem.category === item.category)
        .slice(0, 3);
      setRelatedItems(related);
    } catch (error) {
      console.error('Failed to load dish details', error);
    } finally {
      setLoadingDetails(false);
    }
  }, [itemId, item.category]);

  useEffect(() => {
    if (!isOpen) return;
    loadDishDetails();
  }, [isOpen, loadDishDetails]);

  const handleToggle = async (event) => {
    event.stopPropagation();
    setToggling(true);
    try {
      const { data } = await toggleAvailability(itemId);
      updateItem(data.data);
    } catch (err) {
      console.error('Toggle failed', err);
    } finally {
      setToggling(false);
    }
  };

  const handleOpen = () => {
    setReviewError('');
    setReviewSuccess('');
    setIsOpen(true);
  };
  const handleClose = () => setIsOpen(false);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) {
      setReviewError('Please write a comment for your review.');
      return;
    }

    setSubmitting(true);
    setReviewError('');
    setReviewSuccess('');

    try {
      await createReview({
        rating: newRating,
        comment: newComment.trim(),
        menuItem: itemId
      });

      setReviewSuccess('Thank you! Your review has been added.');
      setNewComment('');
      setNewRating(5);

      // Re-fetch dish reviews and update local state
      const { data: reviewData } = await getReviews({ menuItem: itemId });
      const updatedReviews = reviewData.data || [];
      setDishReviews(updatedReviews);

      const newTotal = updatedReviews.length;
      const newSum = updatedReviews.reduce((acc, r) => acc + (r.rating || 0), 0);
      const newAvg = newTotal > 0 ? Number((newSum / newTotal).toFixed(1)) : 0;

      setAvgRating(newAvg);
      setRevCount(newTotal);

      // Update parent menu context
      updateItem({
        ...item,
        averageRating: newAvg,
        reviewCount: newTotal
      });
    } catch (err) {
      setReviewError(err.response?.data?.error || 'Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <article
        className={`menu-card card ${!item.isAvailable ? 'menu-card--unavailable' : ''}`}
        onClick={handleOpen}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleOpen();
          }
        }}
        role="button"
        tabIndex={0}
      >
        <div className="menu-card__image-wrap">
          {item.badge && (
            <span className="menu-card__ribbon">{item.badge}</span>
          )}
          <img
            src={item.image || '/images/dinner.jpg'}
            alt={item.name}
            className="menu-card__image"
            onError={(e) => { e.target.src = '/images/dinner.jpg'; }}
          />

          <Tooltip content={item.isAvailable ? "Available today" : "Sold out today"} position="top">
            <div className={`menu-card__avail-badge ${item.isAvailable ? 'available' : 'sold-out'}`}>
              <span className={`avail-dot ${item.isAvailable ? 'available' : 'unavailable'}`} />
              {item.isAvailable ? 'Available' : 'Sold Out'}
            </div>
          </Tooltip>

          <Tooltip content={item.isVeg ? 'Vegetarian dish' : 'Non-Vegetarian dish'} position="bottom">
            <div className={`menu-card__diet-dot ${item.isVeg ? 'veg' : 'nonveg'}`} />
          </Tooltip>
        </div>

        <div className="menu-card__body">
          <div className="menu-card__tags">
            {(item.tags || []).map((tag) => (
              <Tooltip key={tag} content={`${TAG_LABELS[tag]?.label || tag} dish`} position="top">
                <span className="badge badge-gold">
                  {TAG_LABELS[tag]?.icon} {TAG_LABELS[tag]?.label || tag}
                </span>
              </Tooltip>
            ))}
          </div>
          <div className="menu-card__header-row">
            <h3 className="menu-card__name">{item.name}</h3>
          </div>

          {/* Star-rating pill / Leave a review button */}
          <div className="menu-card__rating-row">
            {revCount > 0 ? (
              <Tooltip content={`Rated ${avgRating} stars based on ${revCount} reviews`} position="top">
                <div className="rating-pill">
                  <span className="rating-pill__star">⭐</span>
                  <span className="rating-pill__score">{avgRating}</span>
                  <span className="rating-pill__count">({revCount})</span>
                </div>
              </Tooltip>
            ) : (
              <Tooltip content="Be the first to review this dish!" position="top">
                <div className="rating-pill rating-pill--empty">
                  <span className="rating-pill__star">⭐</span>
                  <span className="rating-pill__link">Leave a review</span>
                </div>
              </Tooltip>
            )}
            {item.orderCount > 0 && (
              <span className="menu-card__orders">· {item.orderCount} orders</span>
            )}
          </div>

          <p className="menu-card__desc">{item.description}</p> 

          <div className="menu-card__footer">
            <span className="menu-card__price">₹{item.price}</span>
            <Tooltip content={`Preparation time: ${item.preparationTime} minutes`} position="top">
              <span className="menu-card__time">⏱ {item.preparationTime} min</span>
            </Tooltip>
          </div>

          {isAdmin && (
            <div className="menu-card__admin" onClick={(event) => event.stopPropagation()}>
              <Tooltip content={item.isAvailable ? "Mark as sold out" : "Mark as available"} position="top">
                <span className="menu-card__admin-label">
                  {item.isAvailable ? 'Mark as Sold Out' : 'Mark as Available'}
                </span>
              </Tooltip>
              <Tooltip content="Toggle dish availability" position="top">
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={item.isAvailable}
                    onChange={handleToggle}
                    disabled={toggling}
                  />
                  <span className="toggle-slider" />
                </label>
              </Tooltip>
            </div>
          )}
        </div>

        <style>{`
          .menu-card { position: relative; display: flex; flex-direction: column; cursor: pointer; transition: transform var(--transition), border-color var(--transition), box-shadow var(--transition); }
          .menu-card:hover { transform: translateY(-4px); border-color: var(--color-border-hover); box-shadow: 0 12px 30px rgba(0,0,0,0.18); }
          .menu-card--unavailable { opacity: 0.6; }
          .menu-card--unavailable .menu-card__image { filter: grayscale(60%); }
          .menu-card__image-wrap { position: relative; overflow: hidden; height: 200px; }
          .menu-card__image { width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s ease; }
          .menu-card:hover .menu-card__image { transform: scale(1.05); }

          .menu-card__avail-badge {
            position: absolute;
            top: 10px;
            right: 10px;
            display: flex;
            align-items: center;
            gap: 5px;
            padding: 4px 10px;
            border-radius: var(--radius-full);
            font-size: 0.65rem;
            font-weight: 600;
            letter-spacing: 0.06em;
            text-transform: uppercase;
            backdrop-filter: blur(8px);
          }
          .menu-card__avail-badge.available { background: rgba(76,175,125,0.2); color: var(--color-success); border: 1px solid rgba(76,175,125,0.3); }
          .menu-card__avail-badge.sold-out  { background: rgba(120,120,120,0.25); color: var(--color-text-muted); border: 1px solid rgba(120,120,120,0.3); }

          .menu-card__diet-dot {
            position: absolute;
            bottom: 10px;
            left: 10px;
            width: 18px;
            height: 18px;
            border-radius: 3px;
            border: 2px solid;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .menu-card__diet-dot::after {
            content: '';
            width: 8px;
            height: 8px;
            border-radius: 50%;
          }
          .menu-card__diet-dot.veg    { border-color: var(--color-success); }
          .menu-card__diet-dot.veg::after { background: var(--color-success); }
          .menu-card__diet-dot.nonveg { border-color: var(--color-error); }
          .menu-card__diet-dot.nonveg::after { background: var(--color-error); }
          .menu-card__ribbon {
            position: absolute;
            top: 10px;
            left: 10px;
            background: rgba(0,0,0,0.55);
            color: var(--color-primary);
            font-size: 0.65rem;
            font-weight: 700;
            letter-spacing: 0.05em;
            text-transform: uppercase;
            padding: 4px 10px;
            border-radius: var(--radius-full);
            backdrop-filter: blur(8px);
            z-index: 1;
          }

          .menu-card__rating {
            display: flex;
            align-items: center;
            gap: 0.4rem;
            font-size: 0.78rem;
            color: var(--color-text-faint);
          }
          .menu-card__stars { color: var(--color-primary); letter-spacing: 1px; }
          .menu-card__rating-text { color: var(--color-text-muted); }
          .menu-card__orders { color: var(--color-text-faint); }

          .menu-card__body { padding: var(--space-lg); flex: 1; display: flex; flex-direction: column; gap: var(--space-xs); }
          .menu-card__tags { display: flex; flex-wrap: wrap; gap: var(--space-xs); margin-bottom: 2px; }
          .menu-card__name { font-family: var(--font-serif); font-size: 1.3rem; color: var(--color-text); }
          
          .menu-card__rating-row { margin: 2px 0 6px 0; }
          .rating-pill {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            padding: 3px 9px;
            border-radius: var(--radius-full);
            background: rgba(201, 169, 98, 0.12);
            border: 1px solid rgba(201, 169, 98, 0.28);
            color: var(--color-primary);
            font-size: 0.8rem;
            font-weight: 600;
            transition: all var(--transition);
          }
          .rating-pill:hover {
            background: rgba(201, 169, 98, 0.22);
            border-color: var(--color-primary);
          }
          .rating-pill--empty {
            background: rgba(255, 255, 255, 0.05);
            border-color: var(--color-border);
            color: var(--color-text-muted);
          }
          .rating-pill--empty:hover {
            color: var(--color-primary);
            border-color: rgba(201, 169, 98, 0.3);
          }
          .rating-pill__star { font-size: 0.85rem; }
          .rating-pill__score { color: var(--color-primary); }
          .rating-pill__count { color: var(--color-text-muted); font-weight: 400; font-size: 0.76rem; }
          .rating-pill__link { text-decoration: underline; font-size: 0.78rem; font-weight: 500; }

          .menu-card__desc { font-size: 0.85rem; color: var(--color-text-muted); line-height: 1.5; flex: 1; }
          .menu-card__footer { display: flex; align-items: center; justify-content: space-between; margin-top: auto; padding-top: var(--space-md); border-top: 1px solid var(--color-border); }
          .menu-card__price { font-family: var(--font-serif); font-size: 1.4rem; color: var(--color-primary); }
          .menu-card__time  { font-size: 0.75rem; color: var(--color-text-faint); }

          .menu-card__admin {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding-top: var(--space-md);
            border-top: 1px dashed var(--color-border);
          }
          .menu-card__admin-label { font-size: 0.75rem; color: var(--color-text-faint); }

          .menu-card-detail__backdrop {
            position: fixed;
            inset: 0;
            background: rgba(6, 6, 6, 0.82);
            backdrop-filter: blur(12px);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: var(--space-xl);
            z-index: 2000;
          }
          .menu-card-detail {
            width: min(920px, 100%);
            max-height: 90vh;
            overflow-y: auto;
            background: var(--color-bg-card);
            border: 1px solid var(--color-border);
            border-radius: var(--radius-lg);
            box-shadow: 0 20px 60px rgba(0,0,0,0.5);
            display: grid;
            grid-template-columns: 1.05fr 0.95fr;
          }
          .menu-card-detail__media { position: relative; min-height: 340px; }
          .menu-card-detail__image { width: 100%; height: 100%; object-fit: cover; }
          .menu-card-detail__content { padding: var(--space-xl); display: flex; flex-direction: column; gap: var(--space-lg); }
          .menu-card-detail__header { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--space-md); }
          .menu-card-detail__title { font-family: var(--font-serif); font-size: 1.8rem; color: var(--color-text); margin: 0.3rem 0 0.2rem; }
          .menu-card-detail__subtitle { font-size: 0.82rem; color: var(--color-text-faint); text-transform: capitalize; }
          .menu-card-detail__price-pill { background: rgba(201,169,98,0.14); border: 1px solid rgba(201,169,98,0.28); color: var(--color-primary); padding: 0.6rem 0.95rem; border-radius: var(--radius-full); font-weight: 600; white-space: nowrap; }
          .menu-card-detail__desc { color: var(--color-text-muted); line-height: 1.8; font-size: 0.94rem; }
          .menu-card-detail__meta { display: flex; flex-wrap: wrap; gap: 0.6rem; }
          .menu-card-detail__tag { display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.45rem 0.8rem; border-radius: var(--radius-full); background: rgba(255,255,255,0.05); border: 1px solid var(--color-border); color: var(--color-text-muted); font-size: 0.8rem; }
          .menu-card-detail__tag.veg { color: var(--color-success); border-color: rgba(76,175,125,0.25); }
          .menu-card-detail__tag.nonveg { color: var(--color-error); border-color: rgba(224,92,92,0.2); }
          
          .dish-rating-overview {
            display: flex;
            align-items: center;
            gap: 1.2rem;
            padding: 1rem;
            background: rgba(201, 169, 98, 0.06);
            border: 1px solid rgba(201, 169, 98, 0.16);
            border-radius: var(--radius-md);
          }
          .dish-rating-overview__score-box {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding-right: 1.2rem;
            border-right: 1px solid rgba(201, 169, 98, 0.2);
          }
          .dish-rating-overview__score {
            font-family: var(--font-serif);
            font-size: 2rem;
            font-weight: 700;
            color: var(--color-primary);
            line-height: 1;
          }
          .dish-rating-overview__label {
            font-size: 0.75rem;
            color: var(--color-text-muted);
            margin-top: 4px;
          }
          .dish-rating-overview__details {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }

          .stars-inline { display: inline-flex; gap: 2px; }
          .star-filled { color: var(--color-primary); }
          .star-empty { color: var(--color-text-faint); opacity: 0.4; }

          .menu-card-detail__reviews { display: flex; flex-direction: column; gap: 0.8rem; }
          .menu-card-detail__reviews h4 { font-family: var(--font-serif); font-size: 1.15rem; color: var(--color-text); margin: 0; }
          
          .menu-card-detail__reviews-list {
            max-height: 240px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
            padding-right: 4px;
          }
          .menu-card-detail__review { padding: 0.9rem 1rem; background: rgba(255,255,255,0.03); border: 1px solid var(--color-border); border-radius: var(--radius-md); }
          .menu-card-detail__review-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem; }
          .menu-card-detail__review strong { color: var(--color-text); font-size: 0.92rem; }
          .menu-card-detail__review p { color: var(--color-text-muted); font-size: 0.88rem; line-height: 1.5; margin: 0; }

          .review-form {
            display: flex;
            flex-direction: column;
            gap: 0.8rem;
            padding: 1rem;
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid var(--color-border);
            border-radius: var(--radius-md);
            margin-top: 0.5rem;
          }
          .review-form h5 { font-family: var(--font-serif); font-size: 1rem; color: var(--color-text); margin: 0; }
          .star-picker { display: flex; gap: 4px; font-size: 1.4rem; cursor: pointer; }
          .star-picker-btn { background: none; border: none; font-size: 1.4rem; cursor: pointer; padding: 0 2px; transition: transform 0.1s ease; }
          .star-picker-btn:hover { transform: scale(1.2); }
          .review-form__textarea {
            width: 100%;
            background: var(--color-bg);
            border: 1px solid var(--color-border);
            border-radius: var(--radius-sm);
            padding: 0.75rem;
            color: var(--color-text);
            font-size: 0.88rem;
            resize: vertical;
            min-height: 70px;
            font-family: inherit;
          }
          .review-form__textarea:focus { outline: none; border-color: var(--color-primary); }
          .review-form__actions { display: flex; justify-content: flex-end; }
          .review-form__msg { font-size: 0.82rem; padding: 0.4rem 0.6rem; border-radius: var(--radius-sm); }
          .review-form__msg--error { background: rgba(224,92,92,0.15); color: var(--color-error); border: 1px solid rgba(224,92,92,0.3); }
          .review-form__msg--success { background: rgba(76,175,125,0.15); color: var(--color-success); border: 1px solid rgba(76,175,125,0.3); }

          .login-prompt {
            padding: 0.85rem;
            background: rgba(201, 169, 98, 0.05);
            border: 1px dashed rgba(201, 169, 98, 0.25);
            border-radius: var(--radius-md);
            font-size: 0.85rem;
            color: var(--color-text-muted);
            text-align: center;
          }
          .login-prompt__link { color: var(--color-primary); font-weight: 600; text-decoration: underline; }

          .menu-card-detail__related { display: flex; flex-wrap: wrap; gap: 0.75rem; }
          .menu-card-detail__related-item { padding: 0.5rem 0.8rem; border-radius: var(--radius-md); background: rgba(201,169,98,0.08); color: var(--color-primary); font-size: 0.82rem; border: 1px solid rgba(201,169,98,0.16); }
          .menu-card-detail__close {
            position: absolute;
            top: 1rem;
            right: 1rem;
            border: none;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: rgba(0,0,0,0.5);
            color: var(--color-text);
            font-size: 1.3rem;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background var(--transition);
          }
          .menu-card-detail__close:hover { background: rgba(0,0,0,0.8); color: var(--color-primary); }

          @media (max-width: 768px) {
            .menu-card-detail { grid-template-columns: 1fr; }
            .menu-card-detail__media { min-height: 240px; }
            .menu-card-detail__content { padding: var(--space-lg); }
          }
        `}</style>
      </article>

      {isOpen && (
        <div className="menu-card-detail__backdrop" onClick={handleClose}>
          <div className="menu-card-detail" onClick={(event) => event.stopPropagation()}>
            <div className="menu-card-detail__media">
              <img
                src={item.image || '/images/dinner.jpg'}
                alt={item.name}
                className="menu-card-detail__image"
                onError={(e) => { e.target.src = '/images/dinner.jpg'; }}
              />
              <button type="button" className="menu-card-detail__close" onClick={handleClose} aria-label="Close dish details">×</button>
            </div>
            <div className="menu-card-detail__content">
              <div className="menu-card-detail__header">
                <div>
                  <span className="section-label">Dish Details & Reviews</span>
                  <h3 className="menu-card-detail__title">{item.name}</h3>
                  <p className="menu-card-detail__subtitle">{item.category} • {item.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}</p>
                  {item.reviewCount > 0 && (
                    <p className="menu-card-detail__subtitle">
                      {renderStars(item.rating)} {item.rating.toFixed(1)} · {item.reviewCount} reviews
                      {item.orderCount > 0 && ` · ${item.orderCount} orders this month`}
                    </p>
                  )}
                </div>
                <div className="menu-card-detail__price-pill">₹{item.price}</div>
              </div>

              <p className="menu-card-detail__desc">{item.description}</p>

              <div className="menu-card-detail__meta">
                <span className={`menu-card-detail__tag ${item.isVeg ? 'veg' : 'nonveg'}`}>
                  {item.isVeg ? '🟢 Vegetarian' : '🔴 Non-Vegetarian'}
                </span>
                <span className="menu-card-detail__tag">⏱ {item.preparationTime} min</span>
                <span className="menu-card-detail__tag">{item.category}</span>
                {item.calories != null && (
                  <span className="menu-card-detail__tag">🔥 {item.calories} kcal · {energyBand(item.calories)}</span>
                )}
                {(item.workoutTags || []).map((tag) => (
                  <span key={tag} className="menu-card-detail__tag">{tag}</span>
                ))}
              </div>

              {/* Rating Overview Box */}
              <div className="dish-rating-overview">
                <div className="dish-rating-overview__score-box">
                  <span className="dish-rating-overview__score">{revCount > 0 ? avgRating : 'N/A'}</span>
                  <span className="dish-rating-overview__label">{revCount} {revCount === 1 ? 'Rating' : 'Ratings'}</span>
                </div>
                <div className="dish-rating-overview__details">
                  <Stars rating={Math.round(avgRating)} />
                  <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                    {revCount > 0 ? `Overall ${avgRating} out of 5 stars` : 'No reviews recorded yet for this dish.'}
                  </span>
                </div>
              </div>

              {/* Dish Specific Reviews List */}
              <div className="menu-card-detail__reviews">
                <h4>Guest Reviews ({dishReviews.length})</h4>
                {loadingDetails ? (
                  <p className="menu-card-detail__desc">Loading dish reviews...</p>
                ) : dishReviews.length > 0 ? (
                  <div className="menu-card-detail__reviews-list">
                    {dishReviews.map((review) => (
                      <div key={review._id || review.id} className="menu-card-detail__review">
                        <div className="menu-card-detail__review-header">
                          <strong>{review.user?.name || 'Guest'}</strong>
                          <Stars rating={review.rating} />
                        </div>
                        <p>“{review.comment}”</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="menu-card-detail__desc">No testimonials left for this dish yet. Be the first to share your thoughts!</p>
                )}
              </div>

              {/* Submit Review Form for Authenticated Users */}
              <div className="menu-card-detail__reviews">
                <h4>Leave a Review</h4>
                {user ? (
                  <form className="review-form" onSubmit={handleSubmitReview}>
                    <h5>Rate this dish:</h5>
                    <div className="star-picker">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          className="star-picker-btn"
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => setNewRating(star)}
                          aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                        >
                          <span className={(hoverRating || newRating) >= star ? 'star-filled' : 'star-empty'}>★</span>
                        </button>
                      ))}
                    </div>

                    <textarea
                      className="review-form__textarea"
                      placeholder="What did you think of this dish? (e.g., spice level, flavor, recommendation)"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      maxLength={500}
                      rows={3}
                      required
                    />

                    {reviewError && <div className="review-form__msg review-form__msg--error">{reviewError}</div>}
                    {reviewSuccess && <div className="review-form__msg review-form__msg--success">{reviewSuccess}</div>}

                    <div className="review-form__actions">
                      <button type="submit" className="btn btn-primary" disabled={submitting}>
                        {submitting ? 'Submitting...' : 'Submit Review'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="login-prompt">
                    Please <Link to="/auth" className="login-prompt__link" onClick={handleClose}>log in</Link> to write a review for this dish.
                  </div>
                )}
              </div>

              {relatedItems.length > 0 && (
                <div className="menu-card-detail__reviews">
                  <h4>Related Dishes</h4>
                  <div className="menu-card-detail__related">
                    {relatedItems.map((relatedItem) => (
                      <span key={relatedItem._id || relatedItem.id} className="menu-card-detail__related-item">{relatedItem.name}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MenuCard;
