import { db } from "../server/db";
import { wellnessActivities, blogPosts } from "../shared/schema";

async function seedWellnessData() {
  // Add wellness activities
  await db.insert(wellnessActivities).values([
    {
      name: "Yoga for Beginners",
      dayOfWeek: "Monday",
      time: "09:00",
      location: "Downtown Wellness Center",
      totalSlots: 15,
      bookedSlots: 8,
      description: "Join our gentle yoga class designed for beginners. Learn basic poses and breathing techniques."
    },
    {
      name: "Nutrition Workshop", 
      dayOfWeek: "Wednesday",
      time: "14:00",
      location: "Harare Community Center",
      totalSlots: 20,
      bookedSlots: 12,
      description: "Learn about healthy eating habits and meal planning for optimal wellness."
    },
    {
      name: "Meditation & Mindfulness",
      dayOfWeek: "Friday", 
      time: "18:00",
      location: "Zen Garden Center",
      totalSlots: 12,
      bookedSlots: 6,
      description: "Discover the benefits of meditation and mindfulness practices for stress relief."
    }
  ]);

  // Add blog posts
  await db.insert(blogPosts).values([
    {
      title: "Understanding Your Medication Labels",
      authorName: "Dr. Grace Nyambo",
      category: "Medication Safety",
      snippet: "Learn how to read and understand medication labels to ensure safe and effective use of your prescriptions.",
      fullContent: "Learn how to read and understand medication labels to ensure safe and effective use of your prescriptions. This comprehensive guide covers all the essential information you need to know about medication labels, including dosage instructions, warnings, and expiration dates.",
      imageUrl: "/blog/medication-labels.jpg",
      publishDate: new Date("2025-05-20T10:00:00Z"),
      tags: ["medication", "safety", "education"]
    },
    {
      title: "Managing Chronic Conditions with Proper Medication",
      authorName: "Pharmacist John Mwanza", 
      category: "Health Management",
      snippet: "Tips and strategies for effectively managing chronic health conditions through proper medication adherence.",
      fullContent: "Tips and strategies for effectively managing chronic health conditions through proper medication adherence. This article provides practical advice for patients dealing with long-term health conditions and the importance of consistent medication management.",
      imageUrl: "/blog/chronic-conditions.jpg",
      publishDate: new Date("2025-05-18T14:30:00Z"),
      tags: ["chronic", "management", "health"]
    },
    {
      title: "The Importance of Medical Aid in Zimbabwe",
      authorName: "Dr. Patricia Moyo",
      category: "Healthcare Access", 
      snippet: "Exploring how medical aid coverage can help you access quality healthcare and medication.",
      fullContent: "Exploring how medical aid coverage can help you access quality healthcare and medication in Zimbabwe. This article discusses the benefits of medical aid schemes and how they can make healthcare more accessible and affordable for Zimbabwean families.",
      imageUrl: "/blog/medical-aid.jpg",
      publishDate: new Date("2025-05-15T09:15:00Z"),
      tags: ["medical-aid", "healthcare", "access"]
    }
  ]);

  console.log("Wellness and blog data seeded successfully!");
}

seedWellnessData().catch(console.error);