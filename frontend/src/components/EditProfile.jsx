import React, { useState, useRef } from 'react';
import { usersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const EditProfile = ({ profile, onClose }) => {
  const { refreshUser } = useAuth();
  const [name, setName] = useState(profile.name || '');
  const [bio, setBio] = useState(profile.bio || '');
  const [hobbyInput, setHobbyInput] = useState('');
  const [hobbies, setHobbies] = useState(profile.hobbies || []);
  const [avatar, setAvatar] = useState(profile.avatar || '');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(profile.avatar || '');
  const [saving, setSaving] = useState(false);
  const [contact, setContact] = useState(profile.contact || '');
  const [location, setLocation] = useState(profile.location || '');
  const [dateOfBirth, setDateOfBirth] = useState(profile.dateOfBirth || '');
  const [locating, setLocating] = useState(false);
  const fileRef = useRef(null);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('File too large. Max 5MB.');
      return;
    }
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const addHobby = () => {
    const trimmed = hobbyInput.trim();
    if (trimmed && !hobbies.includes(trimmed)) {
      setHobbies([...hobbies, trimmed]);
    }
    setHobbyInput('');
  };

  const removeHobby = (hobby) => {
    setHobbies(hobbies.filter((h) => h !== hobby));
  };

  const handleHobbyKey = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addHobby();
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`
          );
          const data = await res.json();
          const city = data.address?.city || data.address?.town || data.address?.village || '';
          const country = data.address?.country || '';
          setLocation([city, country].filter(Boolean).join(', '));
        } catch {
          setLocation(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
        }
        setLocating(false);
      },
      () => {
        alert('Unable to retrieve your location');
        setLocating(false);
      }
    );
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        bio: bio.trim(),
        hobbies,
        contact: contact.trim(),
        location: location.trim(),
        dateOfBirth
      };
      if (avatarFile) {
        const reader = new FileReader();
        payload.avatar = await new Promise((resolve) => {
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(avatarFile);
        });
      }
      await usersAPI.updateProfile(payload);
      await refreshUser();
      onClose();
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="edit-profile-overlay" onClick={onClose}>
      <div className="edit-profile-modal" onClick={(e) => e.stopPropagation()}>
        <div className="edit-profile-header">
          <h3>Edit Profile</h3>
          <button className="edit-profile-close" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="edit-profile-body">
          <div className="edit-profile-avatar-section" onClick={() => fileRef.current?.click()}>
            <div className="edit-profile-avatar">
              {avatarPreview ? (
                <img src={avatarPreview} alt="" className="edit-profile-avatar-img" />
              ) : (
                profile.name.charAt(0).toUpperCase()
              )}
            </div>
            <span className="edit-profile-avatar-label">Change photo</span>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="edit-profile-file-input"
              onChange={handleAvatarChange}
            />
          </div>

          <div className="edit-profile-field">
            <label className="edit-profile-label">Name</label>
            <input
              type="text"
              className="edit-profile-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              maxLength={50}
            />
          </div>

          <div className="edit-profile-field">
            <label className="edit-profile-label">Bio</label>
            <textarea
              className="edit-profile-textarea"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself"
              rows={3}
              maxLength={200}
            />
          </div>

          <div className="edit-profile-field">
            <label className="edit-profile-label">Contact</label>
            <input
              type="text"
              className="edit-profile-input"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="Phone or email"
              maxLength={100}
            />
          </div>

          <div className="edit-profile-field">
            <label className="edit-profile-label">Location</label>
            <div className="edit-profile-location-row">
              <input
                type="text"
                className="edit-profile-input"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="City, Country"
                maxLength={100}
              />
              <button
                type="button"
                className="edit-profile-locate-btn"
                onClick={getCurrentLocation}
                disabled={locating}
                title="Use current location"
              >
                {locating ? (
                  <span className="edit-profile-spinner" />
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="10" r="3" />
                    <path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="edit-profile-field">
            <label className="edit-profile-label">Date of Birth</label>
            <input
              type="date"
              className="edit-profile-input"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="edit-profile-field">
            <label className="edit-profile-label">Hobbies</label>
            <div className="edit-profile-hobby-input-row">
              <input
                type="text"
                className="edit-profile-input"
                value={hobbyInput}
                onChange={(e) => setHobbyInput(e.target.value)}
                onKeyDown={handleHobbyKey}
                placeholder="Type a hobby and press Enter"
              />
              <button type="button" className="edit-profile-hobby-add" onClick={addHobby}>Add</button>
            </div>
            {hobbies.length > 0 && (
              <div className="edit-profile-hobbies-list">
                {hobbies.map((hobby) => (
                  <span key={hobby} className="edit-profile-hobby-tag">
                    {hobby}
                    <button
                      type="button"
                      className="edit-profile-hobby-remove"
                      onClick={() => removeHobby(hobby)}
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="edit-profile-footer">
          <button className="edit-profile-cancel" onClick={onClose}>Cancel</button>
          <button
            className="edit-profile-save"
            onClick={handleSave}
            disabled={saving || !name.trim()}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;
