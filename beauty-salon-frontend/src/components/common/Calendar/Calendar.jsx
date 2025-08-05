// components/common/Calendar/Calendar.jsx
import React from 'react';
import styles from './Calendar.module.css';

const Calendar = ({ 
  currentDate, 
  onPrevMonth, 
  onNextMonth, 
  onDateClick, 
  appointments = [],
  onAppointmentClick,
  onAppointmentDelete,
  getCustomerName,
  getStatusColor,
  className = "",
  showDeleteButton = true,
  maxAppointmentsPerDay = 2
}) => {
  const monthNames = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];

  const dayNames = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Önceki ayın son günleri
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i);
      days.push({ date: prevDate, isCurrentMonth: false });
    }
    
    // Bu ayın günleri
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }
    
    // Sonraki ayın ilk günleri (6 satır olması için)
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }
    
    return days;
  };

  const getAppointmentsForDate = (date) => {
    return appointments.filter(apt => {
      const aptDate = new Date(apt.appointmentDate);
      return aptDate.toDateString() === date.toDateString();
    });
  };

  const days = getDaysInMonth(currentDate);

  return (
    <div className={`${styles.calendarContainer} ${className}`}>
      {/* Calendar Header */}
      <div className={styles.calendarHeader}>
        <button
          onClick={onPrevMonth}
          className={styles.navButton}
          type="button"
        >
          ◀ Önceki
        </button>
        <h2 className={styles.monthTitle}>
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>
        <button
          onClick={onNextMonth}
          className={styles.navButton}
          type="button"
        >
          Sonraki ▶
        </button>
      </div>

      {/* Day Names */}
      <div className={styles.dayNamesGrid}>
        {dayNames.map(day => (
          <div key={day} className={styles.dayName}>
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Days */}
      <div className={styles.daysGrid}>
        {days.map((dayInfo, index) => {
          const dayAppointments = getAppointmentsForDate(dayInfo.date);
          const isToday = dayInfo.date.toDateString() === new Date().toDateString();
          
          return (
            <div
              key={index}
              onClick={() => onDateClick && onDateClick(dayInfo)}
              className={`
                ${styles.dayCell} 
                ${isToday ? styles.dayToday : ''} 
                ${dayInfo.isCurrentMonth ? styles.dayCurrentMonth : styles.dayOtherMonth}
              `}
            >
              <div className={`${styles.dayNumber} ${isToday ? styles.dayNumberToday : ''}`}>
                {dayInfo.date.getDate()}
              </div>
              
              {/* Appointments */}
              {dayAppointments.slice(0, maxAppointmentsPerDay).map((apt, i) => (
                <div
                  key={i}
                  onClick={(e) => {
                    e.stopPropagation();
                    onAppointmentClick && onAppointmentClick(apt);
                  }}
                  className={styles.appointmentItem}
                  style={{ 
                    backgroundColor: getStatusColor ? getStatusColor(apt.status) : 'var(--appointment-default-color, #4F46E5)'
                  }}
                  title={`${getCustomerName ? getCustomerName(apt.customerId) : 'Müşteri'} - ${new Date(apt.appointmentDate).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`}
                >
                  <div className={styles.appointmentCustomer}>
                    {getCustomerName ? getCustomerName(apt.customerId) : 'Müşteri'}
                  </div>
                  <div className={styles.appointmentTime}>
                    {new Date(apt.appointmentDate).toLocaleTimeString('tr-TR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                  
                  {/* Delete Button */}
                  {showDeleteButton && onAppointmentDelete && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAppointmentDelete(apt.appointmentId);
                      }}
                      className={styles.deleteButton}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              
              {dayAppointments.length > maxAppointmentsPerDay && (
                <div className={styles.moreAppointments}>
                  +{dayAppointments.length - maxAppointmentsPerDay} daha
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Calendar;