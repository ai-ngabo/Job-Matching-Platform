import React, { useMemo } from 'react';
import { CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import './ProfileCompleteness.css';

const ProfileCompleteness = ({ profileData, isCompany, onItemClick }) => {
  const completenessItems = useMemo(() => {
    if (isCompany) {
      return [
        {
          id: 'logo',
          label: 'Company Logo',
          completed: !!profileData?.company?.logo,
          priority: 'high',
          description: 'Upload your company logo'
        },
        {
          id: 'name',
          label: 'Company Name',
          completed: !!profileData?.company?.name?.trim(),
          priority: 'high',
          description: 'Add your official company name'
        },
        {
          id: 'description',
          label: 'Company Description',
          completed: !!profileData?.company?.description?.trim(),
          priority: 'high',
          description: 'Write about your company mission and culture'
        },
        {
          id: 'industry',
          label: 'Industry',
          completed: !!profileData?.company?.industry?.trim(),
          priority: 'medium',
          description: 'Specify your industry sector'
        },
        {
          id: 'website',
          label: 'Website',
          completed: !!profileData?.company?.website?.trim(),
          priority: 'medium',
          description: 'Add your company website'
        },
        {
          id: 'contact',
          label: 'Contact Information',
          completed:
            !!profileData?.company?.contact?.personName?.trim() &&
            !!profileData?.company?.contact?.phone?.trim(),
          priority: 'medium',
          description: 'Add primary contact details'
        },
        {
          id: 'certificate',
          label: 'Business Certificate',
          completed: !!profileData?.company?.businessRegistration?.certificate?.url,
          priority: 'high',
          description: 'Upload business registration certificate for verification'
        }
      ];
    }

    return [
      {
        id: 'avatar',
        label: 'Profile Photo',
        completed: !!profileData?.profile?.avatar,
        priority: 'high',
        description: 'Upload a professional profile photo'
      },
      {
        id: 'name',
        label: 'Full Name',
        completed:
          !!profileData?.profile?.firstName?.trim() &&
          !!profileData?.profile?.lastName?.trim(),
        priority: 'high',
        description: 'Add your first and last name'
      },
      {
        id: 'bio',
        label: 'Professional Bio',
        completed: !!profileData?.profile?.bio?.trim(),
        priority: 'high',
        description: 'Tell employers about your background and goals'
      },
      {
        id: 'skills',
        label: 'Skills',
        completed: (profileData?.profile?.skills?.length || 0) > 0,
        priority: 'high',
        description: 'Add your key professional skills'
      },
      {
        id: 'cv',
        label: 'CV/Resume',
        completed: !!profileData?.profile?.documents?.cv?.url,
        priority: 'medium',
        description: 'Upload your CV for employers to review'
      },
      {
        id: 'experience',
        label: 'Experience Level',
        completed: !!profileData?.profile?.experienceLevel,
        priority: 'medium',
        description: 'Set your professional experience level'
      },
      {
        id: 'education',
        label: 'Education Level',
        completed: !!profileData?.profile?.educationLevel,
        priority: 'medium',
        description: 'Add your highest education qualification'
      },
      {
        id: 'location',
        label: 'Location',
        completed: !!profileData?.profile?.location?.trim(),
        priority: 'low',
        description: 'Set your city and country'
      },
      {
        id: 'id',
        label: 'ID Document',
        completed: !!profileData?.profile?.documents?.idDocument?.url,
        priority: 'low',
        description: 'Upload your national ID for verification'
      }
    ];
  }, [profileData, isCompany]);

  const completedCount = completenessItems.filter((item) => item.completed).length;
  const completionPercentage = Math.round(
    (completedCount / completenessItems.length) * 100
  );

  const incompleteHighPriority = completenessItems.filter(
    (item) => !item.completed && item.priority === 'high'
  );

  const incompleteItems = completenessItems.filter((item) => !item.completed);

  return (
    <div className="profile-completeness">
      <div className="completeness-header">
        <h3>Profile Completeness</h3>
        <span className="completeness-percentage">{completionPercentage}%</span>
      </div>

      <div className="progress-wrapper">
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      <div className="completeness-stats">
        <div className="stat">
          <CheckCircle2 size={16} className="icon-completed" />
          <span>
            <strong>{completedCount}</strong> completed
          </span>
        </div>
        <div className="stat">
          <Circle size={16} className="icon-pending" />
          <span>
            <strong>{incompleteItems.length}</strong> to go
          </span>
        </div>
      </div>

      {incompleteHighPriority.length > 0 && (
        <div className="completeness-alert">
          <AlertCircle size={16} />
          <div>
            <strong>Complete these to boost your visibility:</strong>
            <ul>
              {incompleteHighPriority.map((item) => (
                <li key={item.id}>{item.label}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="completeness-list">
        <h4>Profile Checklist</h4>
        <ul className="checklist">
          {incompleteItems.map((item) => (
            <li
              key={item.id}
              className={`checklist-item priority-${item.priority} ${
                item.completed ? 'completed' : ''
              }`}
              onClick={() => onItemClick?.(item.id)}
              role="button"
              tabIndex={0}
            >
              <span className="checkbox">
                {item.completed ? (
                  <CheckCircle2 size={18} />
                ) : (
                  <Circle size={18} />
                )}
              </span>
              <div className="item-content">
                <span className="item-label">{item.label}</span>
                <span className="item-description">{item.description}</span>
              </div>
            </li>
          ))}
          {incompleteItems.length === 0 && (
            <li className="checklist-complete">
              <CheckCircle2 size={20} className="icon-completed" />
              <span>Your profile is complete! 🎉</span>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default ProfileCompleteness;
