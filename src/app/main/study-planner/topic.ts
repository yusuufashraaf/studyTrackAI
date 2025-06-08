interface SubTopic {
  name: string;
  duration: number;
}

interface CoursePlan {
  topic: string;
  subTopics: SubTopic[];
}
