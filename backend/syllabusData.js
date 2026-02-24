// backend/syllabusData.js

const syllabusData = {
  "btech-mtech-cse": {
    programName: "B.Tech - M.Tech Cyber Security",
    
    semesters: {
        "sem-1": {
            "CTBT-BSC-101": {
            name: "Engineering Mathematics-I",
            credits: 4,
            teacher: "Dr. Suman Debnath",
            type: "Core",
            units: [
            { 
                unitNumber: "I",
                title: "Differential Calculus", 
                topics: ["Successive differentiation", "Leibniz's theorem (without proof)","Taylor's & McLaurin's series for a function of one variable","Evaluation of indeterminate forms by L'Hospital's rule","Infinite Series: Convergence of infinite Series by definition, Zero Test, Comparison Test, Ratio Test, Root Test, Alternating Series, Leibnitz's test, Power Series and radius of convergence"] 
            },
            {
                unitNumber: "II",
                title: "Partial Differentiation and their applications", 
                topics: ["Functions of two variables","Limit and Continuity of function of several variables","Partial derivative, Total derivative, Chain rule","Euler's theorem for homogeneous functions and examples based on it","Jacobian, error and approximation, maxima and minima"]
            },
            {
                unitNumber: "III",
                title: "Integral Calculus", 
                topics: ["Reduction formula for sin^n x, cos^n x, sin^n x cos^m x, tan^n x, cot^n x, n ≥ 2, n ∈ N (without proof)","Beta and Gamma functions and their properties (without proof) and problems","Evaluation of improper integrals of type-I and type-II"]
            },
            {
                unitNumber: "IV",
                title: "Multiple Integrals", 
                topics: ["Double integrals, Evaluation of double integrals","Change the order of integration, change of variables by Jacobian, change into polar co-ordinates","Triple integrals, Application of multiple integrals to find areas and volumes"]
            },
            {
                unitNumber: "V",
                title: "Matrices", 
                topics: ["Types of Matrices, Elementary row operation, Rank of a matrix","Normal form, Consistency of system of simultaneous linear equations","Inverse of a matrix by Gauss Jordan method","Linearly dependent and independent vectors","Eigen values and eigen vectors, Cayley Hamilton theorem"]
            }
        ]
        },
        "CTBT-BSC-102": {
            name: "Engineering Physics",
            credits: 3,
            teacher: "Dr. Bapi Dey",
            type: "Core",
            units: [
            { 
                unitNumber: "I",
                title: "Laws of Motion",
                topics: ["Motion and its physical interpretation","Newton's laws of motion","Law of conservation of linear momentum and its applications","Equilibrium of concurrent forces","Static and kinetic friction","Laws of friction","Rolling friction","Lubrication"]
            },
            {
                unitNumber: "II",
                title: "Circular Motion",
                topics: ["Centripetal and centrifugal force","Examples of circular motion","Projectile motion and its applications"]
            },
            {
                unitNumber: "III",
                title: "Nature and Properties of Wave Optics",
                topics: ["Definition of wave and wave motion","Difference between longitudinal and transverse waves","Nature and properties of electromagnetic waves","Reflection, refraction, polarization and diffraction of light","Refractive index and total internal reflection","Microscopes and astronomical telescopes (reflecting and refracting) and their magnifying powers","Physical and chromatic aberrations","Propagation of sound waves and their properties"]
            },
            {
                unitNumber: "IV",
                title: "Nuclear Physics",
                topics: ["Structure of atom","Rutherford’s model of atom","Bohr model and energy levels","Hydrogen spectrum","Composition and size of nucleus","Atomic masses","Isotopes, isobars and isotones"]
            },
            {
                unitNumber: "V",
                title: "Radioactivity",
                topics: ["Alpha, beta and gamma particles/rays and their properties","Radioactive decay law","Mass-energy relation","Mass defect","Binding energy per nucleon and its variation with mass number","Nuclear fission and fusion"]
            }
        ]
        },
        "CTBT-ESC-101": {
            name: "Basics of Electrical Engineering",
            credits: 3,
            teacher: "Mr. Abhijit Das",
            type: "Core",
            units: [
            { 
                unitNumber: "I",
                title: "Fundamental and Basic Circuit Element",
                topics: ["Concepts of E.M.F., potential difference and current","Resistance and resistors","Effect of temperature on resistance","Temperature coefficient of resistance","Resistors in series and parallel","S.I. units of work, power and energy"]
            },
            {
                unitNumber: "II",
                title: "Electromagnetism",
                topics: ["Magnetic effect of electric current","Cross and dot conventions","Right hand thumb rule and cork screw rule","Magnetic field of long straight conductor, solenoid and toroid","Concept of m.m.f., flux, flux density, reluctance, permeability and field strength","Units and relationships","Series and parallel magnetic circuits","Comparison of electrical and magnetic circuits","Force on current carrying conductor in magnetic field","Fleming’s left-hand rule","Faraday’s laws of electromagnetic induction","Statically and dynamically induced E.M.F.","Self and mutual inductance","Coefficient of coupling","Energy stored in magnetic field","Charging and discharging of inductor and time constant"]
            },
            {
                unitNumber: "III",
                title: "Electrostatics",
                topics: ["Electrostatic field","Electric flux density","Electric field strength","Absolute and relative permittivity","Capacitance and capacitor","Composite dielectric capacitors","Capacitors in series and parallel","Energy stored in capacitors","Charging and discharging of capacitors and time constant"]
            },
            {
                unitNumber: "IV",
                title: "D.C. Circuits & AC Fundamentals",
                topics: ["Classification of electrical networks","Ohm’s law","Kirchhoff’s laws and network solutions","Simplification of networks using series, parallel and star-delta conversions","Sinusoidal voltages and currents","Mathematical and graphical representation","Instantaneous, peak, average and R.M.S. values","Frequency, cycle and period","Peak factor and form factor","Phase difference, leading and lagging quantities","Phasor representation","Rectangular and polar representation of phasors"]
            },
            {
                unitNumber: "V",
                title: "AC Circuits",
                topics: ["Single phase AC circuits","AC circuits with pure resistance, inductance and capacitance","Voltage-current phasor diagrams and waveforms"]
            }
        ]
        },
        "CTBT-ESC-103": {
            name: "Engineering Graphics",
            credits: 2,
            teacher: "Dr. Sandipan Debnath",
            type: "Core",
            units: [
            { 
                unitNumber: "I",
                title: "Introduction & Geometric Constructions",
                topics: ["Drawing instruments and accessories","Drawing layout and lettering","Drawing conventions and dimensioning rules","Geometric constructions","BIS and representative fraction","Types of graphical scales: plain, diagonal, vernier, comparative scale, scale of chords","Engineering curves: parabola, ellipse, hyperbola","Cycloidal curves: spirals, roulettes, trochoids, involutes","Classification and application of engineering curves"]
            },
            {
                unitNumber: "II",
                title: "Projection of Points & Lines",
                topics: ["Basics of projection theory","Principles of projection","Projection methods: 1st angle and 3rd angle","Planes of projections","Symbols for method of projection","Projection of points in quadrants","Projection of lines","Lines inclined to HP and VP","True length and inclinations","Traces of lines"]
            },
            {
                unitNumber: "III",
                title: "Projection of Planes & Solids",
                topics: ["Projection of planes","Types of planes","Projection of plane surfaces and examples","Plane perpendicular to both reference planes","Plane perpendicular to one plane and parallel to another","Plane perpendicular to one plane and inclined to the other","Plane inclined to both planes"]
            },
            {
                unitNumber: "IV",
                title: "Projection & Section of Solids",
                topics: ["Types of solids","Projection of solids: cylinder, cone, pyramid, prism","Sections of solids","Section plane parallel to VP","Section plane parallel to HP","Section plane perpendicular to HP and inclined to VP","Section plane perpendicular to VP and inclined to HP","Intersections of solids","Methods of intersection","Development of surfaces","Methods of development","True shape of section"]
            },
            {
                unitNumber: "V",
                title: "Orthographic & Isometric Projections",
                topics: ["Isometric projection and introduction","Classification and types of projection","1st angle and 3rd angle projection","Projection of points, lines and planes","Isometric axes","Isometric scale","Isometric projection and isometric view","Conversion of isometric to orthographic projections"]
            }
        ]
        },
        "CTBT-HSM-101": {
            name: "Communication Skills",
            credits: 3,
            teacher: "Dr. Debasish Acharjee",
            type: "Core",
            units: [
            { 
                unitNumber: "I",
                title: "Basic Fundamentals of Communication",
                topics: ["Meaning, definition, objectives and characteristics of communication","Communication process","Flow of communication","Introduction to professional communication","Principles of professional communication","Communication networks","Informal communication"]
            },
            {
                unitNumber: "II",
                title: "Non-Verbal Communication",
                topics: ["Introduction to Non-Verbal Communication (NVC)","Components of NVC: Proxemics, Haptics, Kinesics, Chronemics","Paralinguistic features","Other forms of NVC","Importance of NVC in oral communication","Listening skills: Hearing vs Listening","Types and barriers of listening","Active vs Passive listening","Traits of a good listener"]
            },
            {
                unitNumber: "III",
                title: "Writing Skills",
                topics: ["Paragraph development and components of paragraph","Unity, topic sentence, cohesion and coherence","Adequate development","Approaches of paragraph: Inductive, deductive and expository","Types and attributes of good paragraph","Use of transitional words","Business and technical letter writing","Informal and personal letters","Business letter: style, principles and layout","Types of letters: Inquiry, order, quotation, claim and adjustment, sales, credits and circular"]
            },
            {
                unitNumber: "IV",
                title: "Verbal Communications",
                topics: ["Reading skills and purpose of reading","Understanding and interpreting ideas","Reading rates","Techniques of reading","Reading comprehension skills","Reasons for poor reading comprehension","Interpreting technical graphics","Conversation practice and dialogue practice","Telephonic conversation","Speaking for various purposes","Grammar and vocabulary","Parts of speech","Tenses","Active and passive voice","Confusable words"]
            },
            {
                unitNumber: "V",
                title: "Language through Literature",
                topics: ["Selected stories from 'Wise and Otherwise' by Sudha Murthy","A Lesson in Life from a Beggar","Death without Grief","Idealists at Twenty, Realists at Forty","Think Positive, Be Happy","Crisis of Confidence","Sorry, the Line is Busy","Oh Teacher, I Salute Thee","Life is an Examination"]
            }
        ]
        },
        "CTBT-ESC-102": {
            name: "Programming for Problem Solving",
            credits: 3,
            teacher: "Dr. Priya Saha",
            type: "Core",
            units: [
            { 
                unitNumber: "I",
                title: "Fundamentals of Computer",
                topics: ["What is computer","History of computer","Block diagram of computer system","Hardware and software","Types of operating systems","Compiler and interpreter","Programming languages","Flowchart and algorithm"]
            },
            {
                unitNumber: "II",
                title: "Overview of C",
                topics: ["History of C","Features of C","Basic structure of C program","Process of executing a C program","Character set and trigraph sequences","C tokens","Data types","Variables","Storage classes","Symbolic constants","Overflow of data","Operators","Operator precedence and associativity","Type conversions","Input and Output functions"]
            },
            {
                unitNumber: "III",
                title: "Branching & Looping Statements",
                topics: ["Introduction to decision making","If statement and types of if statement","Switch statement","While statement","For statement","Do-while statement","Goto statement","Break and continue statements"]
            },
            {
                unitNumber: "IV",
                title: "Array & Structure",
                topics: ["Introduction to arrays","One-dimensional array","Two-dimensional array","Multidimensional array","Limitations of array","Strings and string handling functions","Array of strings","Defining a structure","Declaring and accessing structure variables","Structure member as array","Structure variable as array","Structure within structure","Unions","Bit fields"]
            },
            {
                unitNumber: "V",
                title: "Pointers and User Defined Functions",
                topics: ["Introduction and advantages of pointers","Declaration of pointers","Chain of pointers","Scale factor","Pointers and arrays","Pointers and structures","Advantages of functions","Elements of functions","Categories of functions","Recursion","Functions and arrays","Functions and structures","Functions and pointers"]
            }
        ]
        },
        "CTВT-BSC-102L": {
            name: "Engineering Physics Laboratory",
            credits: 2,
            teacher: "Dr. Bapi Dey",
            type: "Lab",
            units: [] // Labs often just have practicals, so we can leave this empty or add experiments here later
        },
        "CTBT-ESC-103L": {
            name: "Engineering Graphics Laboratory",
            credits: 2,
            teacher: "Mr. Abhijit Das",
            type: "Lab",
            units: [] 
        },
        "CTBT-ESC-102L": {
            name: "Programming for Problem Solving Laboratory",
            credits: 2,
            teacher: "Dr. Priya Saha",
            type: "Lab",
            units: []
        }
      },
      "sem-2": {},
      "sem-3": {},
      "sem-4": {},
      "sem-5": {},
      "sem-6": {},
      "sem-7": {},
      "sem-8": {},
      "sem-9": {},
      "sem-10": {}
    }
  }
};

module.exports = syllabusData;

// // backend/syllabusData.js

// const syllabusData = {
//   "btech-mtech-cybersecurity": {
//     programName: "B.Tech - M.Tech Cyber Security",
    
//     semesters: {
//       "sem-1": {
//         "CTBT-BSC-101": {
//           name: "Engineering Mathematics-1",
//           credits: 4,
//           units: [
//             { 
//               unitNumber: "I",
//               title: "Differential Calculus", 
//               topics: [
//                 "Successive differentiation", "Leibniz's theorem (without proof)","Taylor's & McLaurin's series for a function of one variable","Evaluation of indeterminate forms by L'Hospital's rule","Infinite Series: Convergence of infinite Series by definition, Zero Test, Comparison Test, Ratio Test, Root Test, Alternating Series, Leibnitz's test, Power Series and radius of convergence"
//               ] 
//             },
//             { 
//               unitNumber: "II",
//               title: "Partial Differentiation and their applications",
//               topics: [
//                 "Functions of two variables","Limit and Continuity of function of several variables","Partial derivative, Total derivative, Chain rule","Euler's theorem for homogeneous functions and examples based on it","Jacobian, error and approximation, maxima and minima"
//               ] 
//             },
//             { 
//               unitNumber: "III",
//               title: "Integral Calculus",
//               topics: [
//                 "Reduction formula for sin^n x, cos^n x, sin^n x cos^m x, tan^n x, cot^n x, n ≥ 2, n ∈ N (without proof)","Beta and Gamma functions and their properties (without proof) and problems","Evaluation of improper integrals of type-I and type-II"
//               ] 
//             },
//             { 
//               unitNumber: "IV",
//               title: "Multiple Integrals",
//               topics: [
//                 "Double integrals, Evaluation of double integrals","Change the order of integration, change of variables by Jacobian, change into polar co-ordinates","Triple integrals, Application of multiple integrals to find areas and volumes"
//               ] 
//             },
//             { 
//               unitNumber: "V",
//               title: "Matrices",
//               topics: [
//                 "Types of Matrices, Elementary row operation, Rank of a matrix",
//                 "Normal form, Consistency of system of simultaneous linear equations",
//                 "Inverse of a matrix by Gauss Jordan method",
//                 "Linearly dependent and independent vectors",
//                 "Eigen values and eigen vectors, Cayley Hamilton theorem"
//               ] 
//             }
//           ]
//         },
        
//         "CTBT-ESC-101": {
//           name: "Basic of Electrical Engineering",
//           credits: 3,
//           units: [
//             { 
//               unitNumber: "I",
//               title: "DC Circuits", 
//               hours: 8, // Placeholder
//               topics: ["Ohm's Law", "Kirchhoff's Laws", "Nodal Analysis"] 
//             }
//           ]
//         }
//       }
//     }
//   },

//   "bsc-msc-applied-sciences": {
//       // You can add this program later!
//   }
// };

// // Fixed the typo here!
// module.exports = syllabusData;