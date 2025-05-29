
import { StoryFramework } from './types';

export const STORY_FRAMEWORKS: StoryFramework[] = [
  {
    id: 'herosJourney',
    name: "Hero's Journey",
    description: "A classic narrative pattern involving a hero who goes on an adventure, learns a lesson, wins a victory with that newfound knowledge, and then returns home transformed.",
    stages: [
      { id: 'ordinaryWorld', name: '1. The Ordinary World', description: 'The hero\'s normal life before the adventure begins.', userContent: '' },
      { id: 'callToAdventure', name: '2. The Call to Adventure', description: 'The hero is presented with a problem, challenge, or adventure.', userContent: '' },
      { id: 'refusalOfTheCall', name: '3. Refusal of the Call', description: 'The hero is reluctant or refuses the call.', userContent: '' },
      { id: 'meetingTheMentor', name: '4. Meeting the Mentor', description: 'The hero encounters a mentor who prepares them for the journey.', userContent: '' },
      { id: 'crossingTheThreshold', name: '5. Crossing the First Threshold', description: 'The hero commits to the adventure and enters the special world.', userContent: '' },
      { id: 'testsAlliesEnemies', name: '6. Tests, Allies, and Enemies', description: 'The hero faces tests, meets allies, and confronts enemies.', userContent: '' },
      { id: 'approachToTheInmostCave', name: '7. Approach to the Inmost Cave', description: 'The hero approaches the central ordeal or conflict.', userContent: '' },
      { id: 'ordeal', name: '8. The Ordeal', description: 'The hero faces a major crisis, often a life-or-death situation.', userContent: '' },
      { id: 'reward', name: '9. Reward (Seizing the Sword)', description: 'The hero overcomes the crisis and gains a reward.', userContent: '' },
      { id: 'theRoadBack', name: '10. The Road Back', description: 'The hero begins the journey back to the ordinary world.', userContent: '' },
      { id: 'resurrection', name: '11. The Resurrection', description: 'The hero faces a final, most dangerous encounter.', userContent: '' },
      { id: 'returnWithTheElixir', name: '12. Return with the Elixir', description: 'The hero returns with something to transform the ordinary world.', userContent: '' },
    ],
  },
  {
    id: 'storyCircle',
    name: "Dan Harmon's Story Circle",
    description: "An 8-step structure focusing on a character's journey of need, search, finding, taking, and returning changed.",
    stages: [
      { id: 'you', name: '1. YOU (A character is in a zone of comfort)', description: 'Establish the protagonist and their ordinary world.', userContent: '' },
      { id: 'need', name: '2. NEED (But they want something)', description: 'The protagonist has a desire or a problem.', userContent: '' },
      { id: 'go', name: '3. GO (They enter an unfamiliar situation)', description: 'The protagonist crosses a threshold into a new world.', userContent: '' },
      { id: 'search', name: '4. SEARCH (Adapt to it)', description: 'The protagonist faces trials and tribulations.', userContent: '' },
      { id: 'find', name: '5. FIND (Get what they wanted)', description: 'The protagonist achieves their initial goal.', userContent: '' },
      { id: 'take', name: '6. TAKE (Pay a heavy price for it)', description: 'The protagonist faces consequences for their actions.', userContent: '' },
      { id: 'return', name: '7. RETURN (Return to their familiar situation)', description: 'The protagonist starts the journey back.', userContent: '' },
      { id: 'change', name: '8. CHANGE (Having changed)', description: 'The protagonist is transformed by their journey.', userContent: '' },
    ],
  },
  {
    id: 'sixStagePlot',
    name: "Michael Hauge's 6-Stage Plot Structure",
    description: "A structure that emphasizes character arc and emotional journey through six key stages, including two major turning points.",
    stages: [
      { id: 'setup', name: 'Stage 1: The Setup', description: 'Introduce the protagonist in their everyday life, showing their identity and current situation before major changes.', userContent: '' },
      { id: 'newSituation', name: 'Stage 2: The New Situation (Inciting Incident)', description: 'An event that thrusts the protagonist into a new, unfamiliar situation, often around the 10% mark.', userContent: '' },
      { id: 'turningPoint1', name: 'Stage 3: Turning Point #1 (End of Act I)', description: 'The protagonist makes a choice or takes an action that fully commits them to a new path, around the 25% mark.', userContent: '' },
      { id: 'risingAction', name: 'Stage 4: Rising Action (Progress)', description: 'The protagonist struggles to achieve their goal, facing obstacles and growing, from 25% to 75% mark.', userContent: '' },
      { id: 'turningPoint2', name: 'Stage 5: Turning Point #2 (End of Act II)', description: 'A major event where all seems lost or the protagonist must make a crucial decision, often a crisis point, around the 75% mark.', userContent: '' },
      { id: 'climaxAndResolution', name: 'Stage 6: Climax and Resolution (Act III)', description: 'The final confrontation and its aftermath, showing the protagonist achieving their goal (or not) and their ultimate transformation.', userContent: '' },
    ],
  },
];

export const MAX_PROJECT_VERSIONS = 15;
