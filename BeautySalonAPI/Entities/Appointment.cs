﻿using Microsoft.EntityFrameworkCore;

namespace BeautySalonAPI.Entities
{
    public class Appointment
    {
        public int AppointmentId { get; set; }

        public int CustomerId { get; set; }
        public Customer Customer { get; set; }

        public int ServiceId { get; set; }
        public Service Service { get; set; }

        public decimal AgreedPrice { get; set; }


        public int TotalSessions { get; set; }
        public int RemainingSessions { get; set; }


        public DateTime AppointmentDate { get; set; }


        public AppointmentStatus Status { get; set; }  // string değil, enum!




    }
}
