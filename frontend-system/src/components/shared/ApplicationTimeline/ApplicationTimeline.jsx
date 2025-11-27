import React from 'react';
import {
  CheckCircle,
  Clock,
  Star,
  Calendar,
  Trophy,
  XCircle,
  Zap
} from 'lucide-react';
import './ApplicationTimeline.css';

const ApplicationTimeline = ({ application }) => {
  if (!application) return null;

  const getStageIcon = (status) => {
    switch (status) {
      case 'submitted':
        return <CheckCircle size={24} />;
      case 'reviewing':
        return <Clock size={24} />;
      case 'shortlisted':
        return <Star size={24} />;
      case 'interview':
        return <Calendar size={24} />;
      case 'accepted':
        return <Trophy size={24} />;
      case 'rejected':
        return <XCircle size={24} />;
      default:
        return <Zap size={24} />;
    }
  };

  const getStageLabel = (status) => {
    const labels = {
      submitted: 'Application Submitted',
      reviewing: 'Under Review',
      shortlisted: 'Shortlisted',
      interview: 'Interview Scheduled',
      accepted: 'Job Offer',
      rejected: 'Application Status'
    };
    return labels[status] || status;
  };

  const getStageColor = (status) => {
    switch (status) {
      case 'submitted':
        return 'blue';
      case 'reviewing':
        return 'amber';
      case 'shortlisted':
        return 'emerald';
      case 'interview':
        return 'sky';
      case 'accepted':
        return 'green';
      case 'rejected':
        return 'red';
      default:
        return 'gray';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Build timeline from status history
  const timelineEvents = [];
  
  // Add initial submission
  if (application.appliedAt) {
    timelineEvents.push({
      status: 'submitted',
      date: application.appliedAt,
      note: 'Your application was submitted'
    });
  }

  // Add status history events
  if (application.statusHistory && Array.isArray(application.statusHistory)) {
    application.statusHistory.forEach(event => {
      timelineEvents.push({
        status: event.status,
        date: event.changedAt,
        note: event.note || `Status updated to ${event.status}`
      });
    });
  }

  return (
    <div className="application-timeline">
      <div className="timeline-header">
        <h3>📋 Application Journey</h3>
        <p className="timeline-subtitle">Track your progress with {application.companyName || 'Company'}</p>
      </div>

      <div className="timeline-container">
        {timelineEvents.map((event, index) => (
          <div key={index} className={`timeline-event ${event.status}`}>
            <div className="timeline-marker">
              <div className={`marker-circle marker-${getStageColor(event.status)}`}>
                {getStageIcon(event.status)}
              </div>
            </div>

            <div className="timeline-content">
              <div className="event-header">
                <h4 className="event-title">
                  {getStageLabel(event.status)}
                </h4>
                <span className={`event-badge badge-${getStageColor(event.status)}`}>
                  {event.status}
                </span>
              </div>

              <div className="event-details">
                <p className="event-date">
                  📅 {formatDate(event.date)}
                </p>
                {event.note && (
                  <p className="event-note">
                    💬 {event.note}
                  </p>
                )}
              </div>

              {/* Special details for interview stage */}
              {event.status === 'interview' && application.interview && (
                <div className="interview-details">
                  <div className="interview-item">
                    <span className="interview-label">Type:</span>
                    <span className="interview-value">
                      {application.interview.interviewType === 'video' && '📹 Video Call'}
                      {application.interview.interviewType === 'phone' && '📞 Phone Call'}
                      {application.interview.interviewType === 'in-person' && '🏢 In-Person'}
                    </span>
                  </div>
                  {application.interview.scheduledAt && (
                    <div className="interview-item">
                      <span className="interview-label">Scheduled:</span>
                      <span className="interview-value">
                        {formatDate(application.interview.scheduledAt)}
                      </span>
                    </div>
                  )}
                  {application.interview.interviewLink && (
                    <div className="interview-item">
                      <a 
                        href={application.interview.interviewLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="interview-link"
                      >
                        🔗 Join Interview
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>

            {index < timelineEvents.length - 1 && <div className="timeline-line" />}
          </div>
        ))}
      </div>

      {/* Final Outcome */}
      {(application.status === 'accepted' || application.status === 'rejected') && (
        <div className="timeline-outcome">
          {application.status === 'accepted' && (
            <div className="outcome success">
              <div className="outcome-icon">🎉</div>
              <div className="outcome-content">
                <h4>Congratulations!</h4>
                <p>You've received a job offer! Check your email for offer details.</p>
              </div>
            </div>
          )}
          {application.status === 'rejected' && (
            <div className="outcome rejected">
              <div className="outcome-icon">💪</div>
              <div className="outcome-content">
                <h4>Keep Going!</h4>
                <p>This role wasn't the right fit, but there are many more opportunities ahead. Keep applying!</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Current Status Summary */}
      <div className="timeline-summary">
        <div className="summary-item">
          <span className="summary-label">Current Status:</span>
          <span className={`summary-value status-${getStageColor(application.status)}`}>
            {getStageLabel(application.status)}
          </span>
        </div>
        {application.statusHistory && application.statusHistory.length > 0 && (
          <div className="summary-item">
            <span className="summary-label">Last Update:</span>
            <span className="summary-value">
              {formatDate(application.statusHistory[application.statusHistory.length - 1].changedAt)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApplicationTimeline;
