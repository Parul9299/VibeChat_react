import { useState, useEffect, useRef } from 'react';
import { Plus, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

export const StatusView = () => {
  const { profile } = useAuth();
  const [statuses, setStatuses] = useState([]);
  const [myStatuses, setMyStatuses] = useState([]);
  const [showUpload, setShowUpload] = useState(false);
  const [caption, setCaption] = useState('');
  const [selectedStatus, setSelectedStatus] = useState(null);
  const fileInputRef = useRef(null);
  useEffect(() => {
    if (profile) {
      loadStatuses();
      loadMyStatuses();
    }
  }, [profile]);
  const loadStatuses = async () => {
    const { data } = await supabase
      .from('status_updates')
      .select('*')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });
    if (data) {
      const statusesWithUsers = await Promise.all(
        data.map(async (status) => {
          const { data: user } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', status.user_id)
            .maybeSingle();
          return { ...status, user: user || undefined };
        })
      );
      setStatuses(statusesWithUsers.filter((s) => s.user_id !== profile?.id));
    }
  };
  const loadMyStatuses = async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('status_updates')
      .select('*')
      .eq('user_id', profile.id)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });
    if (data) {
      setMyStatuses(data);
    }
  };
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${profile.id}/${fileName}`;
    const { error: uploadError } = await supabase.storage
      .from('status')
      .upload(filePath, file);
    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      return;
    }
    const { data: { publicUrl } } = supabase.storage
      .from('status')
      .getPublicUrl(filePath);
    let contentType = 'text';
    if (file.type.startsWith('image/')) contentType = 'image';
    else if (file.type.startsWith('video/')) contentType = 'video';
    await supabase.from('status_updates').insert({
      user_id: profile.id,
      content_type: contentType,
      content_url: publicUrl,
      caption: caption || null,
    });
    setCaption('');
    setShowUpload(false);
    loadMyStatuses();
    loadStatuses();
  };
  const viewStatus = async (status) => {
    if (!profile) return;
    setSelectedStatus(status);
    await supabase.from('status_views').insert({
      status_id: status.id,
      viewer_id: profile.id,
    });
  };
  const deleteStatus = async (statusId) => {
    await supabase.from('status_updates').delete().eq('id', statusId);
    loadMyStatuses();
  };
  return (
    <div className="flex-1 flex flex-col" style={{ backgroundColor: '#020E20' }}>
      <div className="p-4 border-b"
           style={{ backgroundColor: '#021142', borderColor: '#051834' }}>
        <h2 className="text-xl font-bold" style={{ color: '#FFFFFF' }}>
          Status
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-6">
          <h3 className="text-sm font-semibold mb-3" style={{ color: '#526F8A' }}>
            MY STATUS
          </h3>
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => setShowUpload(!showUpload)}
              className="w-16 h-16 rounded-full flex items-center justify-center border-2 border-dashed hover:border-solid transition-all"
              style={{ borderColor: '#FFD87C' }}
            >
              <Plus className="w-8 h-8" style={{ color: '#FFD87C' }} />
            </button>
            <div>
              <p className="font-medium" style={{ color: '#FFFFFF' }}>
                Add Status
              </p>
              <p className="text-sm" style={{ color: '#526F8A' }}>
                Share your moments
              </p>
            </div>
          </div>
          {showUpload && (
            <div className="p-4 rounded-lg mb-4" style={{ backgroundColor: '#051834' }}>
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Add a caption..."
                className="w-full px-3 py-2 rounded-lg mb-3 outline-none"
                style={{ backgroundColor: '#021142', color: '#FFFFFF' }}
              />
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*,video/*"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2 rounded-lg font-medium"
                style={{
                  background: 'linear-gradient(135deg, #FFD87C 0%, #CA973E 100%)',
                  color: '#031229',
                }}
              >
                Choose File
              </button>
            </div>
          )}
          {myStatuses.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {myStatuses.map((status) => (
                <div key={status.id} className="relative">
                  <button
                    onClick={() => viewStatus({ ...status, user: profile || undefined })}
                    className="w-full aspect-square rounded-lg overflow-hidden"
                    style={{
                      backgroundImage: `url(${status.content_url})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  />
                  <button
                    onClick={() => deleteStatus(status.id)}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
                  >
                    <X className="w-4 h-4" style={{ color: '#FFFFFF' }} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div>
          <h3 className="text-sm font-semibold mb-3" style={{ color: '#526F8A' }}>
            RECENT UPDATES
          </h3>
          <div className="space-y-3">
            {statuses.map((status) => (
              <button
                key={status.id}
                onClick={() => viewStatus(status)}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-opacity-5 hover:bg-white transition-colors"
              >
                <div
                  className="w-14 h-14 rounded-full border-2 flex-shrink-0"
                  style={{
                    borderColor: '#FFD87C',
                    backgroundImage: `url(${status.content_url})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                />
                <div className="flex-1 text-left">
                  <p className="font-medium" style={{ color: '#FFFFFF' }}>
                    {status.user?.full_name}
                  </p>
                  <p className="text-sm" style={{ color: '#526F8A' }}>
                    {new Date(status.created_at).toLocaleString()}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
      {selectedStatus && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(3, 18, 41, 0.95)' }}
          onClick={() => setSelectedStatus(null)}
        >
          <div className="max-w-2xl w-full">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-semibold"
                     style={{ backgroundColor: '#385B9E', color: '#FFFFFF' }}>
                  {selectedStatus.user?.full_name[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-medium" style={{ color: '#FFFFFF' }}>
                    {selectedStatus.user?.full_name}
                  </p>
                  <p className="text-sm" style={{ color: '#526F8A' }}>
                    {new Date(selectedStatus.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStatus(null)}
                className="p-2 rounded-full hover:bg-opacity-10 hover:bg-white"
              >
                <X className="w-6 h-6" style={{ color: '#FFFFFF' }} />
              </button>
            </div>
            <div className="rounded-lg overflow-hidden">
              {selectedStatus.content_type === 'image' && (
                <img
                  src={selectedStatus.content_url || ''}
                  alt="status"
                  className="w-full"
                />
              )}
              {selectedStatus.content_type === 'video' && (
                <video
                  src={selectedStatus.content_url || ''}
                  controls
                  className="w-full"
                />
              )}
              {selectedStatus.caption && (
                <p className="mt-4 text-center" style={{ color: '#FFFFFF' }}>
                  {selectedStatus.caption}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};