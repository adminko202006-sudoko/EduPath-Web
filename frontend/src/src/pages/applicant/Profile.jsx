import { useEffect, useRef, useState } from 'react';
import {
  Camera,
  User,
  Trash2,
  Upload,
  Mail,
  ShieldCheck,
  Save,
  CheckCircle2,
  AlertCircle,
  ImagePlus,
  CalendarDays,
  Phone,
  MapPin,
  VenusAndMars,
  UserRound,
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const Profile = () => {
  const { token, user } = useAuth();

  const [profile, setProfile] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    birth_date: '',
    gender: '',
    phone: '',
    address: '',
    email: '',
    profilePhoto: null,
  });

  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');

  const fileInputRef = useRef(null);

  /*
  |--------------------------------------------------------------------------
  | Load Applicant Profile
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await api.get('/applicant/profile', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = response.data?.data;

        const applicant = data?.applicant;
        const account = data?.user;

        setProfile({
          first_name:
            applicant?.first_name || '',
          middle_name:
            applicant?.middle_name || '',
          last_name:
            applicant?.last_name || '',
          birth_date:
            applicant?.birth_date
              ? applicant.birth_date.substring(0, 10)
              : '',
          gender:
            applicant?.gender || '',
          phone:
            applicant?.phone || '',
          address:
            applicant?.address || '',
          email:
            account?.email ||
            user?.email ||
            '',
          profilePhoto:
            data?.profile_photo_url || null,
        });
      } catch (error) {
        console.error(
          'Failed to load profile:',
          error
        );

        setProfile({
          first_name:
            user?.applicant?.first_name || '',
          middle_name:
            user?.applicant?.middle_name || '',
          last_name:
            user?.applicant?.last_name || '',
          birth_date:
            user?.applicant?.birth_date
              ? user.applicant.birth_date.substring(0, 10)
              : '',
          gender:
            user?.applicant?.gender || '',
          phone:
            user?.applicant?.phone || '',
          address:
            user?.applicant?.address || '',
          email:
            user?.email || '',
          profilePhoto: null,
        });

        setMessage(
          'Unable to load your latest profile information.'
        );
        setMessageType('error');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      loadProfile();
    }
  }, [token, user]);

  /*
  |--------------------------------------------------------------------------
  | Handle Input Changes
  |--------------------------------------------------------------------------
  */

  const handleChange = (e) => {
    const { name, value } = e.target;

    setProfile((prev) => ({
      ...prev,
      [name]: value,
    }));

    setMessage('');
  };

  /*
  |--------------------------------------------------------------------------
  | Profile Photo Selection
  |--------------------------------------------------------------------------
  */

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    // Maximum 2 MB
    if (file.size > 2 * 1024 * 1024) {
      setMessage(
        'Profile picture must not be larger than 2 MB.'
      );
      setMessageType('error');
      return;
    }

    // Allowed image types
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
    ];

    if (!allowedTypes.includes(file.type)) {
      setMessage(
        'Please select a JPG, PNG, or WEBP image.'
      );
      setMessageType('error');
      return;
    }

    setSelectedPhoto(file);

    const previewUrl = URL.createObjectURL(file);
    setPhotoPreview(previewUrl);

    setMessage('');
  };

  /*
  |--------------------------------------------------------------------------
  | Upload Profile Photo
  |--------------------------------------------------------------------------
  */

  const handlePhotoUpload = async () => {
    if (!selectedPhoto) {
      return;
    }

    setUploadingPhoto(true);
    setMessage('');

    try {
      const formData = new FormData();

      formData.append(
        '_method',
        'PUT'
      );

      formData.append(
        'profile_photo',
        selectedPhoto
      );

      const response = await api.post(
        '/applicant/profile',
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type':
              'multipart/form-data',
          },
        }
      );

      const data = response.data;

      const newPhoto =
        data.data?.profile_photo_url ||
        data.profile_photo_url ||
        null;

      setProfile((prev) => ({
        ...prev,
        profilePhoto: newPhoto,
      }));

      setSelectedPhoto(null);
      setPhotoPreview(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      setMessage(
        'Profile picture updated successfully.'
      );

      setMessageType('success');
    } catch (error) {
      console.error(
        'Failed to upload profile photo:',
        error
      );

      setMessage(
        error.response?.data?.message ||
          'Failed to upload profile picture.'
      );

      setMessageType('error');
    } finally {
      setUploadingPhoto(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Cancel Selected Photo
  |--------------------------------------------------------------------------
  */

  const handleCancelPhoto = () => {
    setSelectedPhoto(null);
    setPhotoPreview(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    setMessage('');
  };

  /*
  |--------------------------------------------------------------------------
  | Save Applicant Information
  |--------------------------------------------------------------------------
  */

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSaving(true);
    setMessage('');

    try {
      const response = await api.put(
        '/applicant/profile',
        {
          first_name: profile.first_name,
          middle_name: profile.middle_name,
          last_name: profile.last_name,
          birth_date: profile.birth_date,
          gender: profile.gender,
          phone: profile.phone,
          address: profile.address,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = response.data?.data;
      const applicant = data?.applicant;

      setProfile((prev) => ({
        ...prev,
        first_name:
          applicant?.first_name ||
          prev.first_name,
        middle_name:
          applicant?.middle_name ||
          '',
        last_name:
          applicant?.last_name ||
          prev.last_name,
        birth_date:
          applicant?.birth_date
            ? applicant.birth_date.substring(0, 10)
            : prev.birth_date,
        gender:
          applicant?.gender ||
          prev.gender,
        phone:
          applicant?.phone ||
          prev.phone,
        address:
          applicant?.address ||
          prev.address,
        email:
          data?.user?.email ||
          prev.email,
        profilePhoto:
          data?.profile_photo_url ||
          prev.profilePhoto,
      }));

      setMessage(
        'Profile updated successfully.'
      );

      setMessageType('success');

      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    } catch (error) {
      console.error(
        'Failed to update profile:',
        error
      );

      const validationErrors =
        error.response?.data?.errors;

      if (validationErrors) {
        const firstError =
          Object.values(validationErrors)?.[0]?.[0];

        setMessage(
          firstError ||
            'Please check the information you entered.'
        );
      } else {
        setMessage(
          error.response?.data?.message ||
            'Failed to update profile.'
        );
      }

      setMessageType('error');
    } finally {
      setSaving(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Loading State
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col items-center justify-center py-24">

          <div className="w-12 h-12 rounded-full border-4 border-[#123B5D]/20 border-t-[#123B5D] animate-spin" />

          <p className="mt-5 text-gray-600 dark:text-gray-300 font-medium">
            Loading your profile...
          </p>

          <p className="mt-1 text-sm text-gray-400">
            Please wait a moment.
          </p>

        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Display Values
  |--------------------------------------------------------------------------
  */

  const displayedPhoto =
    photoPreview ||
    profile.profilePhoto;

  const fullName =
    [
      profile.first_name,
      profile.middle_name,
      profile.last_name,
    ]
      .filter(Boolean)
      .join(' ') ||
    'Applicant';

  /*
  |--------------------------------------------------------------------------
  | Main Page
  |--------------------------------------------------------------------------
  */

  return (
    <div className="max-w-5xl mx-auto pb-10">

      {/* ================================================================
          PAGE HEADER
      ================================================================ */}

      <div className="mb-8">

        <div className="flex items-center gap-3">

          <div className="w-11 h-11 rounded-xl bg-[#123B5D] flex items-center justify-center shadow-sm">
            <UserRound
              size={22}
              className="text-white"
            />
          </div>

          <div>

            <h1 className="text-3xl font-bold text-[#123B5D] dark:text-white">
              My Profile
            </h1>

            <p className="mt-1 text-gray-500 dark:text-gray-400">
              Manage your EduPath applicant information.
            </p>

          </div>

        </div>

      </div>

      {/* ================================================================
          PROFILE HEADER
      ================================================================ */}

      <div className="bg-white dark:bg-[#102333] rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden mb-6 transition-colors">

        {/* Navy Banner */}

        <div className="h-28 bg-[#123B5D] relative overflow-hidden">

          <div className="absolute inset-0 opacity-10">

            <div className="absolute -right-10 -top-16 w-56 h-56 rounded-full border-[35px] border-white" />

            <div className="absolute right-24 top-8 w-20 h-20 rounded-full border-8 border-white" />

          </div>

          <div className="absolute right-8 bottom-4 hidden sm:flex items-center gap-2 text-white/80 text-sm">
            <ShieldCheck size={17} />
            Verified Applicant Account
          </div>

        </div>

        {/* Profile Content */}

        <div className="px-6 pb-6">

          <div className="flex flex-col sm:flex-row sm:items-end gap-5 -mt-14 relative">

            {/* Profile Photo */}

            <div className="relative flex-shrink-0">

              {displayedPhoto ? (

                <img
                  src={displayedPhoto}
                  alt="Applicant profile"
                  className="w-28 h-28 rounded-2xl object-cover border-4 border-white dark:border-[#102333] shadow-lg ring-1 ring-gray-200 dark:ring-gray-600"
                />

              ) : (

                <div className="w-28 h-28 rounded-2xl bg-[#123B5D] flex items-center justify-center border-4 border-white dark:border-[#102333] shadow-lg ring-1 ring-gray-200 dark:ring-gray-600">

                  <User
                    size={50}
                    className="text-white"
                  />

                </div>

              )}

              <button
                type="button"
                onClick={() =>
                  fileInputRef.current?.click()
                }
                className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl bg-[#F4B400] text-white flex items-center justify-center shadow-md hover:bg-[#D9A900] transition-colors duration-200"
                title="Choose profile picture"
              >
                <Camera size={18} />
              </button>

            </div>

            {/* Applicant Name */}

            <div className="flex-1 pb-1">

              <h2 className="text-2xl font-bold text-[#123B5D] dark:text-white">
                {fullName}
              </h2>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2">

                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <Mail size={15} />
                  {profile.email ||
                    'No email available'}
                </div>

                <div className="flex items-center gap-2 text-sm text-[#C99A00] dark:text-[#F4B400] font-medium">
                  <ShieldCheck size={15} />
                  Applicant Account
                </div>

              </div>

            </div>

          </div>

        </div>

      </div>

      {/* ================================================================
          MESSAGE
      ================================================================ */}

      {message && (

        <div
          className={`flex items-start gap-3 px-4 py-3.5 rounded-xl border mb-6 ${
            messageType === 'error'
              ? 'bg-red-50 border-red-200 text-red-700 dark:bg-red-950/30 dark:border-red-900 dark:text-red-300'
              : 'bg-green-50 border-green-200 text-green-700 dark:bg-green-950/30 dark:border-green-900 dark:text-green-300'
          }`}
        >

          {messageType === 'error' ? (

            <AlertCircle
              size={19}
              className="mt-0.5 flex-shrink-0"
            />

          ) : (

            <CheckCircle2
              size={19}
              className="mt-0.5 flex-shrink-0"
            />

          )}

          <p className="text-sm font-medium">
            {message}
          </p>

        </div>

      )}

      {/* ================================================================
          PROFILE PICTURE
      ================================================================ */}

      <div className="bg-white dark:bg-[#102333] rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6 mb-6 transition-colors">

        <div className="flex items-start gap-3 mb-6">

          <div className="w-10 h-10 rounded-xl bg-[#123B5D]/10 dark:bg-white/10 flex items-center justify-center flex-shrink-0">
            <ImagePlus
              size={20}
              className="text-[#123B5D] dark:text-[#5eead4]"
            />
          </div>

          <div>

            <h2 className="text-lg font-bold text-[#123B5D] dark:text-white">
              Profile Picture
            </h2>

            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Add a profile picture to personalize your applicant account.
            </p>

          </div>

        </div>

        <div className="flex flex-col lg:flex-row lg:items-center gap-6">

          {/* Preview */}

          <div className="flex items-center gap-4">

            <div className="w-20 h-20 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 flex items-center justify-center">

              {displayedPhoto ? (

                <img
                  src={displayedPhoto}
                  alt="Profile preview"
                  className="w-full h-full object-cover"
                />

              ) : (

                <User
                  size={30}
                  className="text-gray-400"
                />

              )}

            </div>

            <div>

              <p className="font-semibold text-gray-800 dark:text-gray-200">

                {selectedPhoto
                  ? selectedPhoto.name
                  : 'Current profile picture'}

              </p>

              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                JPG, PNG, or WEBP · Maximum 2 MB
              </p>

            </div>

          </div>

          {/* Controls */}

          <div className="flex flex-wrap gap-3 lg:ml-auto">

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePhotoSelect}
              className="hidden"
            />

            <button
              type="button"
              onClick={() =>
                fileInputRef.current?.click()
              }
              className="inline-flex items-center gap-2 bg-[#123B5D] hover:bg-[#0F3553] text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors duration-200"
            >
              <Camera size={17} />
              Choose Picture
            </button>

            {selectedPhoto && (
              <>

                <button
                  type="button"
                  onClick={handlePhotoUpload}
                  disabled={uploadingPhoto}
                  className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors duration-200"
                >

                  <Upload size={17} />

                  {uploadingPhoto
                    ? 'Uploading...'
                    : 'Upload Picture'}

                </button>

                <button
                  type="button"
                  onClick={handleCancelPhoto}
                  disabled={uploadingPhoto}
                  className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors duration-200"
                >

                  <Trash2 size={17} />
                  Cancel

                </button>

              </>
            )}

          </div>

        </div>

      </div>

      {/* ================================================================
          PERSONAL INFORMATION
      ================================================================ */}

      <form onSubmit={handleSubmit}>

        <div className="bg-white dark:bg-[#102333] rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6 mb-6 transition-colors">

          <div className="flex items-start gap-3 mb-7">

            <div className="w-10 h-10 rounded-xl bg-[#123B5D]/10 dark:bg-white/10 flex items-center justify-center flex-shrink-0">
              <User
                size={20}
                className="text-[#123B5D] dark:text-[#5eead4]"
              />
            </div>

            <div>

              <h2 className="text-lg font-bold text-[#123B5D] dark:text-white">
                Personal Information
              </h2>

              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Keep your applicant information accurate and up to date.
              </p>

            </div>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* First Name */}

            <div>

              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                First Name
              </label>

              <div className="relative">

                <User
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="text"
                  name="first_name"
                  value={profile.first_name}
                  onChange={handleChange}
                  required
                  className="w-full pl-11 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-[#0b1c2a] text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#123B5D]/20 focus:border-[#123B5D] transition"
                  placeholder="Enter first name"
                />

              </div>

            </div>

            {/* Middle Name */}

            <div>

              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                Middle Name
                <span className="text-gray-400 font-normal ml-1">
                  (Optional)
                </span>
              </label>

              <div className="relative">

                <User
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="text"
                  name="middle_name"
                  value={profile.middle_name}
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-[#0b1c2a] text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#123B5D]/20 focus:border-[#123B5D] transition"
                  placeholder="Enter middle name"
                />

              </div>

            </div>

            {/* Last Name */}

            <div>

              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                Last Name
              </label>

              <div className="relative">

                <User
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="text"
                  name="last_name"
                  value={profile.last_name}
                  onChange={handleChange}
                  required
                  className="w-full pl-11 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-[#0b1c2a] text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#123B5D]/20 focus:border-[#123B5D] transition"
                  placeholder="Enter last name"
                />

              </div>

            </div>

            {/* Date of Birth */}

            <div>

              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                Date of Birth
              </label>

              <div className="relative">

                <CalendarDays
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="date"
                  name="birth_date"
                  value={profile.birth_date}
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-[#0b1c2a] text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#123B5D]/20 focus:border-[#123B5D] transition"
                />

              </div>

            </div>

            {/* Gender */}

            <div>

              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                Gender
              </label>

              <div className="relative">

                <VenusAndMars
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 z-10"
                />

                <select
                  name="gender"
                  value={profile.gender}
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-[#0b1c2a] text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#123B5D]/20 focus:border-[#123B5D] transition appearance-none"
                >

                  <option value="">
                    Select gender
                  </option>

                  <option value="Male">
                    Male
                  </option>

                  <option value="Female">
                    Female
                  </option>

                  <option value="Other">
                    Other
                  </option>

                </select>

              </div>

            </div>

          </div>

        </div>

        {/* ==============================================================
            CONTACT INFORMATION
        ============================================================== */}

        <div className="bg-white dark:bg-[#102333] rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6 mb-6 transition-colors">

          <div className="flex items-start gap-3 mb-7">

            <div className="w-10 h-10 rounded-xl bg-[#123B5D]/10 dark:bg-white/10 flex items-center justify-center flex-shrink-0">
              <Phone
                size={20}
                className="text-[#123B5D] dark:text-[#5eead4]"
              />
            </div>

            <div>

              <h2 className="text-lg font-bold text-[#123B5D] dark:text-white">
                Contact Information
              </h2>

              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Make sure your contact details are current.
              </p>

            </div>

          </div>

          <div className="space-y-5">

            {/* Phone */}

            <div>

              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                Phone Number
              </label>

              <div className="relative">

                <Phone
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="tel"
                  name="phone"
                  value={profile.phone}
                  onChange={handleChange}
                  placeholder="e.g. 09171234567"
                  className="w-full pl-11 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-[#0b1c2a] text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#123B5D]/20 focus:border-[#123B5D] transition"
                />

              </div>

            </div>

            {/* Address */}

            <div>

              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                Complete Address
              </label>

              <div className="relative">

                <MapPin
                  size={18}
                  className="absolute left-4 top-4 text-gray-400"
                />

                <textarea
                  name="address"
                  value={profile.address}
                  onChange={handleChange}
                  rows="4"
                  placeholder="Enter your complete address"
                  className="w-full pl-11 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-[#0b1c2a] text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#123B5D]/20 focus:border-[#123B5D] transition resize-none"
                />

              </div>

            </div>

          </div>

        </div>

        {/* ==============================================================
            ACCOUNT INFORMATION
        ============================================================== */}

        <div className="bg-white dark:bg-[#102333] rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6 mb-6 transition-colors">

          <div className="flex items-start gap-3 mb-7">

            <div className="w-10 h-10 rounded-xl bg-[#123B5D]/10 dark:bg-white/10 flex items-center justify-center flex-shrink-0">
              <ShieldCheck
                size={20}
                className="text-[#123B5D] dark:text-[#5eead4]"
              />
            </div>

            <div>

              <h2 className="text-lg font-bold text-[#123B5D] dark:text-white">
                Account Information
              </h2>

              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Some account details are managed by EduPath.
              </p>

            </div>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* Email */}

            <div>

              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                Email Address
              </label>

              <div className="relative">

                <Mail
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className="w-full pl-11 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                />

              </div>

              <p className="text-xs text-gray-400 mt-2">
                Your email address cannot be changed here.
              </p>

            </div>

            {/* Account Type */}

            <div>

              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                Account Type
              </label>

              <div className="relative">

                <ShieldCheck
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="text"
                  value="Applicant"
                  disabled
                  className="w-full pl-11 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                />

              </div>

              <p className="text-xs text-gray-400 mt-2">
                Your account type is managed by EduPath.
              </p>

            </div>

          </div>

        </div>

        {/* ==============================================================
            SAVE BUTTON
        ============================================================== */}

        <div className="flex justify-end">

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 bg-[#123B5D] hover:bg-[#0F3553] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold px-7 py-3 rounded-xl transition-colors duration-200 shadow-sm"
          >

            <Save size={18} />

            {saving
              ? 'Saving...'
              : 'Save Changes'}

          </button>

        </div>

      </form>

    </div>
  );
};

export default Profile;