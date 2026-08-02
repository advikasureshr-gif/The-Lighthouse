import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getAvailableSlots, createReservation } from '../api/reservationApi';
import { useMenu } from '../context/MenuContext';
import { useAuth } from '../context/AuthContext';
import { useReservation } from '../context/ReservationContext';
import Tooltip from '../components/Tooltip';

const STEPS = ['Reserve Table', 'Pre-order Menu', 'Review & Confirm'];

const SEATING_OPTIONS = [
  { value: 'any', label: 'Any Seating (No Preference)' },
  { value: 'main', label: 'Indoor Dining Hall' },
  { value: 'outdoor', label: 'Outdoor Patio & Garden' },
  { value: 'window', label: 'Window View Seat' },
  { value: 'private', label: 'Private Room' }
];

const CATEGORIES = ['all', 'breakfast', 'lunch', 'dinner', 'desserts', 'drinks'];
const CATEGORY_ICONS = {
  all: '🍽️', breakfast: '🍳', lunch: '🥗',
  dinner: '🌙', desserts: '🍰', drinks: '🍸'
};

const Reserve = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { items: menuItems, fetchMenu } = useMenu();
  const { 
    reservationDetails, 
    preOrder, 
    setReservationDetails, 
    addToPreOrder, 
    updatePreOrderQuantity, 
    clearReservation 
  } = useReservation();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  // Local state for slots
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  // Local state for menu filter in step 1
  const [category, setCategory] = useState('all');
  const [dietFilter, setDietFilter] = useState('all');

  // Local state for simulated deposit payment
  const [depositChecked, setDepositChecked] = useState(false);
  const [specialRequests, setSpecialRequests] = useState('');

  const today = new Date().toISOString().split('T')[0];

  // Fetch full menu on load
  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  // Hook for sticky bottom bar navigation event
  useEffect(() => {
    const handleNavConfirm = () => {
      setStep(2);
    };
    window.addEventListener('nav-to-confirm', handleNavConfirm);
    return () => window.removeEventListener('nav-to-confirm', handleNavConfirm);
  }, []);

  // Automatically fetch slots when date, guests, or seatingPreference changes
  const checkSlots = async () => {
    if (!reservationDetails.date || !reservationDetails.guests) return;
    setSlotsLoading(true);
    setError('');
    try {
      const { data } = await getAvailableSlots(
        reservationDetails.date, 
        reservationDetails.guests, 
        reservationDetails.seatingPreference
      );
      setSlots(data.data.slots || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch available slots');
    } finally {
      setSlotsLoading(false);
    }
  };
  useEffect(() => {
    if (reservationDetails.date && reservationDetails.guests) {
      checkSlots();
    }
  }, [reservationDetails.date, reservationDetails.guests, reservationDetails.seatingPreference]);

  useEffect(() => {
    if (window.location.hash === '#reservation-form') {
      requestAnimationFrame(() => {
        const formSection = document.getElementById('reservation-form');
        if (formSection) {
          formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    }
  }, []);

  // Filtered menu list for pre-ordering step
  const filteredMenuItems = useMemo(() => {
    return menuItems.filter((item) => {
      if (!item.isAvailable) return false;
      const matchCat = category === 'all' || item.category === category;
      const matchDiet = dietFilter === 'all'
        || (dietFilter === 'veg' && item.isVeg)
        || (dietFilter === 'non-veg' && !item.isVeg);
      return matchCat && matchDiet;
    });
  }, [menuItems, category, dietFilter]);

  // Calculate totals
  const totalItems = preOrder.reduce((acc, item) => acc + item.quantity, 0);
  const totalBill = preOrder.reduce((acc, item) => acc + (item.menuItem.price * item.quantity), 0);
  const maxPrepTime = preOrder.reduce((acc, item) => Math.max(acc, item.menuItem.preparationTime || 0), 0);

  const handleConfirmReservation = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    setLoading(true);
    setError('');

    // Check email format
    const emailRe = /^\S+@\S+\.\S+$/;
    if (!emailRe.test(String(user.email).toLowerCase())) {
      setError('Your account email is invalid. Please update it in your profile before booking.');
      setLoading(false);
      return;
    }

    // Verify deposit payment checkbox
    if (reservationDetails.depositAmount > 0 && !depositChecked) {
      setError('Please pay the refundable deposit to confirm your table.');
      setLoading(false);
      return;
    }

    // Prepare preorder payload: mapping menuItem to ID
    const preOrderPayload = preOrder.map(item => ({
      menuItem: item.menuItem._id || item.menuItem.id,
      quantity: item.quantity
    }));

    try {
      await createReservation({
        date: reservationDetails.date,
        time: reservationDetails.time,
        guests: reservationDetails.guests,
        seatingPreference: reservationDetails.seatingPreference,
        specialRequests: specialRequests,
        preOrder: preOrderPayload,
        confirmationChannel: reservationDetails.confirmationChannel,
        depositAmount: reservationDetails.depositAmount
      });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Reservation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessFinished = () => {
    clearReservation();
    navigate('/');
  };

  if (success) {
    const formattedDate = new Date(reservationDetails.date).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });

    return (
      <main className="page-enter reserve-page">
        <div className="container reserve-success animate-fade-in">
          <div className="success-icon">🎉</div>
          <h1 className="section-title">Reservation Confirmed!</h1>
          <div className="divider">
            <div className="divider-line" /><div className="divider-diamond" /><div className="divider-line right" />
          </div>
          
          <div className="success-card glass">
            <div className="success-details">
              <div className="success-row"><span>Date & Time</span><strong>{formattedDate} at {reservationDetails.time}</strong></div>
              <div className="success-row"><span>Guests</span><strong>{reservationDetails.guests} guests</strong></div>
              <div className="success-row"><span>Seating Preference</span><strong>{SEATING_OPTIONS.find(o => o.value === reservationDetails.seatingPreference)?.label}</strong></div>
              <div className="success-row"><span>Confirmation Alerts</span><strong>Sent via {reservationDetails.confirmationChannel.toUpperCase()} ({user?.phone || user?.email})</strong></div>
              {totalItems > 0 && (
                <>
                  <div className="success-row"><span>Pre-ordered Dishes</span><strong>{totalItems} items</strong></div>
                  <div className="success-row"><span>Estimated Preparation Time</span><strong>{maxPrepTime} mins (Ready on arrival)</strong></div>
                  <div className="success-row"><span>Estimate Total Bill</span><strong className="gold">₹{totalBill}</strong></div>
                </>
              )}
              {reservationDetails.depositAmount > 0 && (
                <div className="success-row"><span>Refundable Deposit Paid</span><strong className="success-text">₹{reservationDetails.depositAmount} ✓</strong></div>
              )}
            </div>
            
            <div className="success-alert">
              🍽️ <strong>Ready When Seated:</strong> Your table is secured and your pre-ordered dishes will be served fresh shortly after you sit down.
            </div>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center', marginTop: 'var(--space-xl)' }}>
            <Tooltip content="Explore and manage details" position="top">
              <button onClick={handleSuccessFinished} className="btn btn-primary">Done & Go Home</button>
            </Tooltip>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="page-enter reserve-page">
      <div className="container">
        <div className="section-header" style={{ paddingTop: 'var(--space-3xl)' }}>
          <span className="section-label">Smart Fine Dining</span>
          <h1 className="section-title">Reserve & Pre-order</h1>
          <div className="divider">
            <div className="divider-line" /><div className="divider-diamond" /><div className="divider-line right" />
          </div>
        </div>

        {/* Wizard Step Indicators */}
        <div className="wizard-steps">
          {STEPS.map((label, i) => (
            <div key={i} className="step-item">
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <Tooltip content={`Step ${i + 1}: ${label}`} position="bottom">
                  <div 
                    className={`step-circle ${i < step ? 'done' : i === step ? 'active' : ''}`}
                    onClick={() => i < step && setStep(i)}
                    style={{ cursor: i < step ? 'pointer' : 'default' }}
                  >
                    {i < step ? '✓' : i + 1}
                  </div>
                </Tooltip>
                <span className={`step-label ${i < step ? 'done' : i === step ? 'active' : ''}`}>{label}</span>
              </div>
              {i < STEPS.length - 1 && <div className={`step-connector ${i < step ? 'done' : ''}`} />}
            </div>
          ))}
        </div>

        {/* WIZARD CARD PANEL */}
        <div className="reserve-card glass" id="reservation-form">
          
          {/* STEP 0: RESERVE TABLE */}
          {step === 0 && (
            <div className="reserve-step">
              <h2 className="reserve-step__title">1. Seating Details & Time Slot</h2>
              
              <div className="reserve-step__fields">
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <Tooltip content="Choose your dining date" position="top">
                    <input 
                      className="form-input" 
                      type="date" 
                      value={reservationDetails.date} 
                      min={today} 
                      onChange={(e) => setReservationDetails({ date: e.target.value })} 
                    />
                  </Tooltip>
                </div>
                <div className="form-group">
                  <label className="form-label">Number of Guests</label>
                  <Tooltip content="Select the size of your party" position="top">
                    <select 
                      className="form-select" 
                      value={reservationDetails.guests} 
                      onChange={(e) => setReservationDetails({ guests: Number(e.target.value) })}
                    >
                      {[1,2,3,4,5,6,7,8].map((n) => <option key={n} value={n}>{n} {n === 1 ? 'guest' : 'guests'}</option>)}
                    </select>
                  </Tooltip>
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Seating Preference</label>
                  <Tooltip content="Choose where you would prefer to sit" position="top">
                    <select 
                      className="form-select" 
                      value={reservationDetails.seatingPreference} 
                      onChange={(e) => setReservationDetails({ seatingPreference: e.target.value })}
                    >
                      {SEATING_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                  </Tooltip>
                </div>
              </div>

              {/* Time Slots Area */}
              {reservationDetails.date && (
                <div className="slots-section" style={{ marginTop: 'var(--space-md)' }}>
                  <h3 className="slots-title">Available Time Slots</h3>
                  {slotsLoading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}><div className="spinner" /></div>
                  ) : slots.length === 0 ? (
                    <p className="no-slots">No slots available for the selected criteria. Try changing the date or seating section.</p>
                  ) : (
                    <div className="slots-grid">
                      {slots.map((slot) => (
                        <Tooltip 
                          key={slot.time} 
                          content={slot.available ? `${slot.tablesAvailable} table${slot.tablesAvailable > 1 ? 's' : ''} available` : 'Fully booked'}
                          position="top"
                        >
                          <button
                            className={`slot-btn ${!slot.available ? 'slot-btn--unavail' : ''} ${reservationDetails.time === slot.time ? 'slot-btn--selected' : ''}`}
                            onClick={() => slot.available && setReservationDetails({ time: slot.time })}
                            disabled={!slot.available}
                          >
                            <span className="slot-time">{slot.time}</span>
                            <span className="slot-status">{slot.available ? `${slot.tablesAvailable} left` : 'Full'}</span>
                          </button>
                        </Tooltip>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {error && <p className="form-error" role="alert">{error}</p>}

              <div className="reserve-step__actions" style={{ justifyContent: 'flex-end' }}>
                <button 
                  className="btn btn-primary"
                  onClick={() => setStep(1)}
                  disabled={!reservationDetails.date || !reservationDetails.time}
                >
                  Continue to Pre-order Menu →
                </button>
              </div>
            </div>
          )}

          {/* STEP 1: PRE-ORDER MENU */}
          {step === 1 && (
            <div className="reserve-step">
              <h2 className="reserve-step__title">2. Choose Dishes in Advance</h2>
              <p className="reserve-step__subtitle">
                Select from our active kitchen menu. Pre-ordering ensures food is prepared in advance so you experience no waiting.
              </p>

              {/* Menu Category and Dietary Tabs */}
              <div className="preorder-menu-filters">
                <div className="menu-tabs" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      className={`menu-tab ${category === cat ? 'menu-tab--active' : ''}`}
                      onClick={() => setCategory(cat)}
                      style={{ fontSize: '0.75rem', padding: '0.4rem 1rem' }}
                    >
                      {CATEGORY_ICONS[cat]} {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </button>
                  ))}
                </div>

                <div className="diet-toggle">
                  {['all', 'veg', 'non-veg'].map((diet) => (
                    <button
                      key={diet}
                      className={`diet-btn ${dietFilter === diet ? 'diet-btn--active' : ''}`}
                      onClick={() => setDietFilter(diet)}
                    >
                      {diet === 'all' ? 'All' : diet === 'veg' ? '🟢 Veg' : '🔴 Non-Veg'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pre-order dishes grid */}
              <div className="preorder-dishes-grid">
                {filteredMenuItems.length === 0 ? (
                  <p style={{ textAlign: 'center', gridColumn: 'span 2', padding: '2rem', color: 'var(--color-text-muted)' }}>
                    No available items match the selected filters.
                  </p>
                ) : (
                  filteredMenuItems.map((item) => {
                    const itemId = item._id || item.id;
                    const orderItem = preOrder.find(p => (p.menuItem._id || p.menuItem.id) === itemId);
                    const qty = orderItem ? orderItem.quantity : 0;
                    
                    return (
                      <div key={itemId} className="preorder-card glass">
                        <img 
                          src={item.image || '/images/dinner.jpg'} 
                          alt={item.name} 
                          onError={(e) => { e.target.src = '/images/dinner.jpg'; }}
                        />
                        <div className="preorder-card__info">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span className={`tonight-item__dot ${item.isVeg ? 'veg' : 'nonveg'}`} />
                                <h4 className="preorder-card__name">{item.name}</h4>
                              </div>
                              <p className="preorder-card__price">₹{item.price}</p>
                            </div>
                            <span className="preorder-card__time">⏱ {item.preparationTime} min</span>
                          </div>

                          <div className="preorder-card__actions">
                            {qty > 0 ? (
                              <div className="preorder-controls" style={{ height: '32px' }}>
                                <button className="preorder-btn" style={{ height: '30px', width: '30px' }} onClick={() => updatePreOrderQuantity(itemId, qty - 1)}>−</button>
                                <span className="preorder-qty" style={{ fontSize: '0.8rem' }}>{qty}</span>
                                <button className="preorder-btn" style={{ height: '30px', width: '30px' }} onClick={() => updatePreOrderQuantity(itemId, qty + 1)}>+</button>
                              </div>
                            ) : (
                              <button className="btn btn-outline btn-sm" style={{ width: '100%', padding: '0.3rem 0.5rem', fontSize: '0.75rem' }} onClick={() => addToPreOrder(item)}>
                                Add to Booking
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Bottom Actions */}
              <div className="reserve-step__actions">
                <button className="btn btn-ghost" onClick={() => setStep(0)}>← Seating Details</button>
                <button className="btn btn-primary" onClick={() => setStep(2)}>
                  {totalItems > 0 ? `Review Pre-order (${totalItems} items) →` : 'Review & Confirm Table →'}
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: REVIEW & CONFIRM */}
          {step === 2 && (
            <div className="reserve-step animate-fade-in">
              <h2 className="reserve-step__title">3. Review & Confirm Booking</h2>

              {!user && (
                <div className="auth-prompt">
                  <p>Please <Link to="/auth" className="gold">sign in</Link> or register to finalize your reservation.</p>
                </div>
              )}

              {/* Summary Layout */}
              <div className="booking-review-summary">
                <div className="booking-summary-column glass">
                  <h3>Table Details</h3>
                  <div className="confirm-row"><span>Date</span><strong>{reservationDetails.date}</strong></div>
                  <div className="confirm-row"><span>Time Slot</span><strong>{reservationDetails.time}</strong></div>
                  <div className="confirm-row"><span>Guests Count</span><strong>{reservationDetails.guests} guests</strong></div>
                  <div className="confirm-row"><span>Seating Prefer.</span><strong>{SEATING_OPTIONS.find(o => o.value === reservationDetails.seatingPreference)?.label}</strong></div>
                  {user && <div className="confirm-row"><span>Guest Name</span><strong>{user.name}</strong></div>}
                </div>

                <div className="booking-summary-column glass">
                  <h3>Advance Pre-orders</h3>
                  {preOrder.length === 0 ? (
                    <p style={{ color: 'var(--color-text-faint)', fontSize: '0.9rem', padding: '1rem 0' }}>No dishes selected. Food can be ordered on arrival.</p>
                  ) : (
                    <div className="preorder-review-list">
                      {preOrder.map((item) => (
                        <div key={item.menuItem._id || item.menuItem.id} className="preorder-review-item">
                          <span>{item.menuItem.name} <strong>x{item.quantity}</strong></span>
                          <span>₹{item.menuItem.price * item.quantity}</span>
                        </div>
                      ))}
                      <div className="preorder-review-totals border-top">
                        <div className="confirm-row" style={{ padding: '8px 0', fontSize: '0.85rem' }}><span>Est. Prep Time</span><strong>{maxPrepTime} mins</strong></div>
                        <div className="confirm-row" style={{ padding: '8px 0', fontSize: '1rem' }}><span className="gold">Estimated Total</span><strong className="gold">₹{totalBill}</strong></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Special Requests Input */}
              <div className="form-group" style={{ marginTop: 'var(--space-md)' }}>
                <label className="form-label">Special Requests (Occasion details, allergens, etc.)</label>
                <textarea 
                  className="form-textarea" 
                  placeholder="E.g., Vegetarian kitchen preparation, celebrating an anniversary..." 
                  value={specialRequests} 
                  onChange={(e) => setSpecialRequests(e.target.value)} 
                  rows={2} 
                />
              </div>

              {/* Alert Channel Selection */}
              <div className="form-group">
                <label className="form-label">Receive Confirmation Via</label>
                <div className="confirmation-channels">
                  {[
                    { value: 'email', label: '📧 Email' },
                    { value: 'whatsapp', label: '💬 WhatsApp' },
                    { value: 'sms', label: '📱 SMS' }
                  ].map((ch) => (
                    <button
                      key={ch.value}
                      className={`channel-btn ${reservationDetails.confirmationChannel === ch.value ? 'channel-btn--active' : ''}`}
                      onClick={() => setReservationDetails({ confirmationChannel: ch.value })}
                    >
                      {ch.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Refundable Deposit Payment Simulation */}
              <div className="deposit-section glass">
                <div className="deposit-header">
                  <span className="deposit-badge">Refundable Deposit</span>
                  <h4>₹{reservationDetails.depositAmount}</h4>
                </div>
                <p className="deposit-desc">
                  To prevent no-shows and support kitchen ingredient planning, a small deposit is required. It is fully refunded or adjusted in your final bill upon arrival.
                </p>
                <label className="deposit-checkbox-container">
                  <input 
                    type="checkbox" 
                    checked={depositChecked} 
                    onChange={(e) => setDepositChecked(e.target.checked)} 
                  />
                  <span className="checkmark" />
                  <span className="checkbox-label">Authorize payment of ₹{reservationDetails.depositAmount} refundable deposit</span>
                </label>
              </div>

              {error && <p className="form-error" role="alert">{error}</p>}

              {/* Submit Buttons */}
              <div className="reserve-step__actions">
                <button className="btn btn-ghost" onClick={() => setStep(1)}>← Modify Pre-orders</button>
                <button 
                  className="btn btn-primary"
                  onClick={handleConfirmReservation}
                  disabled={!user || loading || (reservationDetails.depositAmount > 0 && !depositChecked)}
                >
                  {loading ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : 'Confirm Booking ✓'}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      <style>{`
        .reserve-page { padding-top: var(--navbar-h); padding-bottom: var(--space-3xl); }
        .reserve-card { border-radius: var(--radius-xl); padding: var(--space-2xl); max-width: 800px; margin: 0 auto; }
        .reserve-step { display: flex; flex-direction: column; gap: var(--space-lg); }
        .reserve-step__title { font-family: var(--font-serif); font-size: 1.8rem; color: var(--color-text); margin: 0; }
        .reserve-step__subtitle { font-size: 0.88rem; color: var(--color-text-muted); margin: 0; }
        .reserve-step__fields { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-md); }
        .reserve-step__actions { display: flex; justify-content: space-between; align-items: center; padding-top: var(--space-lg); border-top: 1px solid var(--color-border); margin-top: var(--space-md); }

        /* Slots CSS */
        .slots-section { border-top: 1px solid var(--color-border); padding-top: var(--space-md); }
        .slots-title { font-size: 1rem; font-weight: 600; color: var(--color-text); margin-bottom: var(--space-sm); }
        .no-slots { font-size: 0.85rem; color: var(--color-text-muted); text-align: center; padding: var(--space-md); }
        .slots-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: var(--space-sm); max-height: 240px; overflow-y: auto; padding: 4px; }
        .slot-btn { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 0.5rem; border-radius: var(--radius-md); background: var(--color-bg-card); border: 1px solid var(--color-border); color: var(--color-text-muted); transition: all var(--transition); }
        .slot-btn:hover:not(:disabled) { border-color: var(--color-primary); color: var(--color-text); }
        .slot-btn--selected { border-color: var(--color-primary) !important; background: rgba(201,169,98,0.08) !important; color: var(--color-primary) !important; }
        .slot-btn--unavail { opacity: 0.35; cursor: not-allowed; }
        .slot-time { font-size: 0.9rem; font-weight: 500; }
        .slot-status { font-size: 0.6rem; color: inherit; text-transform: uppercase; letter-spacing: 0.02em; }

        /* Step 1 pre-order menu explore CSS */
        .preorder-menu-filters { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: var(--space-md); border-bottom: 1px solid var(--color-border); padding-bottom: var(--space-sm); }
        .preorder-dishes-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-md); max-height: 380px; overflow-y: auto; padding-right: 4px; }
        .preorder-card { display: flex; background: var(--color-bg-card); border: 1px solid var(--color-border); border-radius: var(--radius-md); overflow: hidden; height: 110px; }
        .preorder-card img { width: 100px; height: 100%; object-fit: cover; flex-shrink: 0; }
        .preorder-card__info { flex: 1; padding: var(--space-sm); display: flex; flex-direction: column; justify-content: space-between; }
        .preorder-card__name { font-size: 0.88rem; font-weight: 500; color: var(--color-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 160px; }
        .preorder-card__price { font-size: 0.82rem; color: var(--color-primary); margin-top: 2px; }
        .preorder-card__time { font-size: 0.7rem; color: var(--color-text-faint); }
        .preorder-card__actions { margin-top: auto; }

        /* Step 2 confirm page CSS */
        .booking-review-summary { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-md); }
        .booking-summary-column { padding: var(--space-md); border-radius: var(--radius-md); background: var(--color-bg-card); border: 1px solid var(--color-border); }
        .booking-summary-column h3 { font-size: 1.1rem; color: var(--color-primary); border-bottom: 1px solid var(--color-border); padding-bottom: 6px; margin-bottom: var(--space-sm); }
        
        .preorder-review-list { display: flex; flex-direction: column; gap: var(--space-xs); max-height: 180px; overflow-y: auto; padding: 6px 0; }
        .preorder-review-item { display: flex; justify-content: space-between; font-size: 0.85rem; color: var(--color-text); }
        .preorder-review-item strong { color: var(--color-primary); margin-left: 4px; }
        .preorder-review-totals { margin-top: auto; padding-top: 6px; }
        
        .confirm-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; font-size: 0.85rem; border-bottom: 1px dashed rgba(255,255,255,0.03); }
        .confirm-row:last-child { border-bottom: none; }
        .confirm-row span { color: var(--color-text-muted); }
        .confirm-row strong { color: var(--color-text); }

        .confirmation-channels { display: flex; gap: var(--space-sm); margin-top: 6px; }
        .channel-btn { flex: 1; padding: 0.5rem; border-radius: var(--radius-sm); background: var(--color-surface); border: 1px solid var(--color-border); color: var(--color-text-muted); font-size: 0.82rem; transition: all var(--transition); text-align: center; cursor: pointer; }
        .channel-btn--active { background: rgba(201,169,98,0.08); border-color: var(--color-primary); color: var(--color-primary); font-weight: 500; }

        /* Refundable Deposit CSS */
        .deposit-section { background: rgba(201,169,98,0.03); border: 1px dashed var(--color-primary); border-radius: var(--radius-md); padding: var(--space-md); display: flex; flex-direction: column; gap: var(--space-xs); }
        .deposit-header { display: flex; justify-content: space-between; align-items: center; }
        .deposit-badge { background: rgba(201,169,98,0.12); color: var(--color-primary); padding: 2px 6px; border-radius: 3px; font-size: 0.65rem; font-weight: 600; text-transform: uppercase; }
        .deposit-desc { font-size: 0.78rem; color: var(--color-text-muted); line-height: 1.4; margin: 0; }

        /* Custom Checkbox */
        .deposit-checkbox-container { display: block; position: relative; padding-left: 28px; cursor: pointer; font-size: 0.82rem; color: var(--color-text); user-select: none; margin-top: 4px; }
        .deposit-checkbox-container input { position: absolute; opacity: 0; cursor: pointer; height: 0; width: 0; }
        .checkmark { position: absolute; top: 2px; left: 0; height: 18px; width: 18px; background-color: var(--color-surface); border: 1px solid var(--color-border); border-radius: 4px; }
        .deposit-checkbox-container:hover input ~ .checkmark { border-color: var(--color-primary); }
        .deposit-checkbox-container input:checked ~ .checkmark { background-color: var(--color-primary); border-color: var(--color-primary); }
        .checkmark:after { content: ""; position: absolute; display: none; }
        .deposit-checkbox-container input:checked ~ .checkmark:after { display: block; }
        .deposit-checkbox-container .checkmark:after { left: 6px; top: 2px; width: 5px; height: 10px; border: solid black; border-width: 0 2px 2px 0; transform: rotate(45deg); }
        .checkbox-label { line-height: 18px; }

        .auth-prompt { background: rgba(224, 92, 92, 0.08); border: 1px solid rgba(224, 92, 92, 0.2); border-radius: var(--radius-md); padding: var(--space-md); font-size: 0.88rem; color: var(--color-error); text-align: center; }
        
        /* Success Screen */
        .success-card { background: var(--color-bg-card); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: var(--space-lg); margin-top: var(--space-lg); display: flex; flex-direction: column; gap: var(--space-md); text-align: left; }
        .success-details { display: flex; flex-direction: column; gap: 2px; }
        .success-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px dashed rgba(255,255,255,0.04); font-size: 0.9rem; }
        .success-row:last-child { border-bottom: none; }
        .success-row span { color: var(--color-text-muted); }
        .success-row strong { color: var(--color-text); }
        .success-text { color: var(--color-success) !important; }
        .success-alert { background: rgba(76, 175, 125, 0.1); border: 1px solid rgba(76, 175, 125, 0.2); color: var(--color-success); padding: var(--space-md); border-radius: var(--radius-md); font-size: 0.85rem; line-height: 1.4; text-align: center; }

        .reserve-success { padding: var(--space-2xl) 0; text-align: center; display: flex; flex-direction: column; align-items: center; gap: var(--space-sm); max-width: 600px; margin: 0 auto; }
        .success-icon { font-size: 4rem; margin-bottom: var(--space-sm); }
        .success-icon { animation: bounce 1s infinite alternate; }

        @keyframes bounce {
          from { transform: translateY(0); }
          to { transform: translateY(-10px); }
        }

        .animate-fade-in { animation: fadeIn 0.5s ease forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }

        @media (max-width: 768px) {
          .reserve-step__fields, .preorder-dishes-grid, .booking-review-summary { grid-template-columns: 1fr; }
          .reserve-card { padding: var(--space-lg); }
        }
      `}</style>
    </main>
  );
};

export default Reserve;
