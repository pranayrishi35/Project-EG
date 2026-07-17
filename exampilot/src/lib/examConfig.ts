// src/lib/examConfig.ts

export type ExamTarget = "AFCAT" | "NDA_MATH" | "NDA_GAT" | "CDS";

export interface ExamConfig {
  total_questions: number;
  duration_seconds: number;
  marks_per_correct: number;
  negative_marking: number;
  subject_breakdown: Record<string, number>; // Subject → question count
}

export const EXAM_CONFIGS: Partial<Record<ExamTarget, ExamConfig>> = {
  AFCAT: {
    total_questions: 100,
    duration_seconds: 7200,
    marks_per_correct: 3,
    negative_marking: -1,
    subject_breakdown: {
      "General Awareness": 25,
      "Verbal Ability in English": 25,
      "Numerical Ability": 25,
      "Reasoning and Military Aptitude": 25,
    },
  },
  CDS: {
    total_questions: 120,
    duration_seconds: 7200,
    marks_per_correct: 3,
    negative_marking: -1,
    subject_breakdown: {
      "English": 40,
      "General Knowledge": 40,
      "Elementary Mathematics": 40,
    },
  },
  NDA_MATH: {
    total_questions: 120,
    duration_seconds: 9000,
    marks_per_correct: 2.5,
    negative_marking: -0.833,
    subject_breakdown: {
      "Mathematics": 120,
    },
  },
  NDA_GAT: {
    total_questions: 150,
    duration_seconds: 9000,
    marks_per_correct: 4,
    negative_marking: -1.33,
    subject_breakdown: {
      "English": 50,
      "General Knowledge": 100,
    },
  },
};

export const DEFAULT_SYLLABUS: Partial<Record<ExamTarget, string>> = {
  AFCAT: `
    **AFCAT Comprehensive Syllabus**
    1. **English:** Comprehension, Error Detection, Sentence Completion/Filling in of correct word, Synonyms, Antonyms, Cloze Test, Idioms and Phrases, Analogy, Sentence Rearranging, One Word Substitution.
    2. **General Awareness:** History, Geography, Civics, Politics, Current Affairs, Environment, Basic Science, Defense, Art, Culture, Sports.
    3. **Numerical Ability:** Decimal Fraction, Time and Work, Average, Profit & Loss, Percentage, Ratio & Proportion and Simple Interest, Time & Distance (Trains/Boats & Streams).
    4. **Reasoning and Military Aptitude:** Venn Diagram, Odd One Out, Analogy, Blood Relations, Missing Characters, Sequential Output training, Directions, Coding-Decoding, Spotting the Embedded Figures, Pattern Completion, Dot Situation.
  `.trim(),
  
  CDS: `
    **CDS Comprehensive Syllabus**
    1. **English:** Reading Comprehension, Fill in the blanks, Sentence Rearrangement, Grammar and Vocabulary, Synonyms and Antonyms, Idioms and Phrases, Spotting Errors.
    2. **General Knowledge:** Current Affairs, Physics, Chemistry, Biology, Indian History, Politics, Geography, Economy, Defense related events and awards.
    3. **Elementary Mathematics:**
       - Arithmetic: Number System, Elementary Number Theory, Time and Work, Percentages, Simple and Compound Interest, Profit and Loss, Ratio and Proportion, Time and Distance.
       - Algebra: Basic Operations, Remainder Theorem, Polynomials, Quadratic Equations, Linear Equations, Set Language and Notation.
       - Trigonometry: Sine, Cosine, Tangent, Heights and Distances, Trigonometric Identities.
       - Geometry: Lines and Angles, Plane and Plane Figures, Triangles, Circles, Loci.
       - Mensuration: Areas of Squares, Rectangles, Parallelograms, Triangles and Circles, Surface Area and Volume of Cuboids, Lateral Surface and Volume of Right Circular Cones and Cylinders, Surface Area and Volume of Spheres.
       - Statistics: Collection and Tabulation of Data, Graphical Representation (Histograms, Bar Charts, Pie Charts), Measures of Central Tendency.
  `.trim(),
  
  NDA_MATH: `
    **NDA Mathematics Syllabus**
    1. Algebra: Sets, Venn Diagrams, De Morgan laws, Cartesian product, Complex numbers, Quadratic equations, Permutations and Combinations, Binomial theorem, Logarithms.
    2. Matrices and Determinants: Types of matrices, operations, Determinant, Adjoint and inverse, Cramer's rule.
    3. Trigonometry: Angles, Trigonometric ratios, Inverse trigonometric functions, Properties of triangles.
    4. Analytical Geometry: 2D and 3D geometry, Distance formula, Equation of a line, Circle, Parabola, Ellipse, Hyperbola, Direction cosines and ratios, Equation of a plane and a sphere.
    5. Differential Calculus: Functions, Limits, Continuity, Derivative, Maxima and Minima.
    6. Integral Calculus and Differential Equations: Integration, Definite integrals, Application in finding areas, Order and degree of differential equations.
    7. Vector Algebra: Vectors in 2D/3D, Scalar and vector products.
    8. Statistics and Probability: Frequency distribution, Mean, Median, Mode, Variance, Standard deviation, Sample space, Events, Mutually exclusive and exhaustive events, Bayes' theorem.
  `.trim(),

  NDA_GAT: `
    **NDA General Ability Test (GAT) Syllabus**
    1. **English:** Grammar, Vocabulary, Comprehension, Spotting Errors, Para Jumbles.
    2. **Physics:** Physical properties, States of matter, Motion, Newton's Laws, Work, Power, Energy, Heat, Light, Sound, Magnetism, Static and Current Electricity.
    3. **Chemistry:** Elements, Mixtures and Compounds, Symbols, Formulae, Chemical Equations, Acids, Bases, Salts, Carbon and its compounds, Fertilizers.
    4. **General Science:** Biology basics, Cells, Human Body, Food, Diseases.
    5. **History & Freedom Movement:** Indian History, Culture, Freedom Movement, Constitution, Five Year Plans, Panchayati Raj, French and Russian Revolutions, UN.
    6. **Geography:** Earth, Origin, Latitudes, Longitudes, Ocean Currents, Atmosphere, Climate, Types of Climate, Resources, Regional Geography of India.
    7. **Current Events:** Recent important events in India and the world, Personalities, Sports.
  `.trim(),
};
