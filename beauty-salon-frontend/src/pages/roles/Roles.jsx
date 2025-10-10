import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout/Layout';
import Modal from '../../components/common/Modal/Modal';
import RoleForm from '../../components/RoleManagement/RoleForm';
import { userService } from '../../api/api';
import { useAuth } from '../../contexts/AuthContext';
import AccessDenied from '../../components/common/AccessDenied/AccessDenied';

const Roles = () => {
  const { isAdmin } = useAuth();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);

  const loadRoles = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await userService.getRoles();
      setRoles(data || []);
    } catch (e) {
      setError('Roller yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  // Admin yetki kontrolü
  if (!isAdmin()) {
    return (
      <AccessDenied 
        title="Erişim Reddedildi"
        message="Bu sayfaya erişim yetkiniz bulunmamaktadır. Sadece admin kullanıcılar rol yönetimi sayfasına erişebilir."
        additionalInfo={[
          "Rol yönetimi sadece admin yetkisine sahip kullanıcılar tarafından yapılabilir.",
          "Yeni roller oluşturmak, mevcut rolleri düzenlemek için admin yetkisi gereklidir.",
          "Rol izinleri ve yetkileri sadece admin tarafından yönetilebilir."
        ]}
      />
    );
  }

  const handleEditRole = (role) => {
    setSelectedRole(role);
    setShowModal(true);
  };


  const handleSaveRole = async () => {
    setShowModal(false);
    await loadRoles();
  };

  return (
    <Layout>
      <div className="pageContainer">
        <div className="card card-gradient mb-md">
          <div className="section-header">
            <div>
              <h2 className="section-title">Rol Yönetimi</h2>
              <p className="section-subtitle">Sistem rollerini yönetin</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="alert alertError">
            <span>⚠️</span>
            {error}
          </div>
        )}

        {loading ? (
          <div className="card">
            <div className="loadingContainer">
              <div className="spinner"></div>
              <p className="loadingText">Roller yükleniyor...</p>
            </div>
          </div>
        ) : (
          <div className="roleGrid">
            {roles.map(role => (
              <div key={role.roleId} className="card roleCard">
                <div className="roleCardHeader">
                  <div className="roleIcon">
                    <span className="roleIconText">{role.name.charAt(0)}</span>
                  </div>
                  <div className="roleInfo">
                    <h3 className="roleName">{role.name}</h3>
                    {role.description && <p className="roleDesc">{role.description}</p>}
                  </div>
                </div>
                <div className="roleCardActions">
                  <button className="btn btnSecondary" onClick={() => handleEditRole(role)}>
                    ✏️ Düzenle
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Modal
          isOpen={showModal}
          title={selectedRole ? 'Rol Düzenle' : 'Yeni Rol Ekle'}
          onClose={() => setShowModal(false)}
          size="medium"
          animation="slideUp"
        >
          <RoleForm role={selectedRole} onSave={handleSaveRole} onCancel={() => setShowModal(false)} />
        </Modal>
      </div>
    </Layout>
  );
};

export default Roles;


