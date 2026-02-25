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

        // ===============================

        "sem-2": {
            "CTВT-BSC-201": {
                name: "Engineering Mathematics-II",
                credits: 4,
                teacher: "Dr. Suman Debnath",
                type: "Core",
                units: [
                    { 
                        unitNumber: "I",
                        title: "Basics Statistics",
                        topics: ["Measures of central tendency","Moments","Expectation","Dispersion","Skewness","Kurtosis","Expected value of two-dimensional random variables","Linear correlation","Correlation coefficient","Rank correlation coefficient","Regression"]
                    },
                    {
                        unitNumber: "II",
                        title: "Curve Fitting",
                        topics: ["Method of least squares","Fitting of straight lines","Fitting of second degree parabola","Fitting of more general curves"]
                    },
                    {
                        unitNumber: "III",
                        title: "Probability",
                        topics: ["Random experiment and trial","Sample point and sample space","Equally likely, mutually exclusive and exhaustive events","Classical, relative and axiomatic definitions of probability","Properties of probability","Conditional probability","Multiplicative law of probability","Independent events","Law of total probability","Bayes theorem and its applications","Binomial distribution","Poisson distribution","Normal distribution"]
                    },
                    {
                        unitNumber: "IV",
                        title: "Roots of Non-Linear Equations",
                        topics: ["Bisection method","Regula-Falsi method","Secant method","Successive approximation method","Newton-Raphson method","Rate of convergence"]
                    },
                    {
                        unitNumber: "V",
                        title: "Finite Differences & Numerical Integration",
                        topics: ["Finite differences","Interpolation","Newton’s formulae","Lagrange’s formula","Divided difference formula for unequal intervals","Newton-Cotes integration formulae","Trapezoidal rule","Simpson’s rules","Gaussian quadrature formulae (one, two and three point)"]
                    }
                ]
            },
            "CTВТ-HSM-201": {
                name: "Professional Ethics",
                credits: 3,
                teacher: "Keshu Ahlawat",
                type: "Core",
                units: [
                    { 
                        unitNumber: "I",
                        title: "Human Values",
                        topics: ["Morals, values and ethics","Integrity and work ethic","Service learning and civil virtue","Respect for others and living peacefully","Caring and sharing","Honesty and courage","Valuing time","Cooperation and commitment","Empathy and self-confidence","Character and spirituality","Social expectations"]
                    },
                    {
                        unitNumber: "II",
                        title: "Engineering Ethics",
                        topics: ["Senses of engineering ethics","Evolution of ethics over the years","Distinction between values and ethics","Variety of moral issues","Types of inquiry","Moral dilemmas and moral autonomy","Kohlberg’s theory","Gilligan’s theory","Consensus and controversy","Models of professional roles","Theories about right action","Self-interest","Customs and religion","Uses of ethical theories","Indian ethical traditions"]
                    },
                    {
                        unitNumber: "III",
                        title: "Professional Practices in Engineering",
                        topics: ["Codes of ethics","Plagiarism and piracy","Balanced outlook on law","Professions and norms of professional conduct","Professional conduct vs profession","Responsibilities and obligations in professional ethics","Limits of predictability and responsibilities in engineering profession","Central responsibilities of engineers","Lessons from Bhopal Gas Tragedy","Lessons from SLV-3","Lessons from Indian Space Shuttle (Wings of Fire)","Lessons from international incidents: Titanic tragedy, Chernobyl nuclear tragedy, American Airline DC-10 crash, Kansas City Hyatt Regency walkway collapse"]
                    },
                    {
                        unitNumber: "IV",
                        title: "Responsibilities and Rights of Engineer",
                        topics: ["Responsibilities and accountability in public issues (safety, hazards, risk)","Collegiality and loyalty","Obligation of loyalty and misguided loyalty","Respect for authority and its limitations","Bootlegging and collective bargaining","Commitments and convictions","Confidentiality","Occupational crime and industrial espionage","Whistle blowing and moral guidelines","Conflicts of interest","Bribes, gifts and kickbacks","Discrimination and preferential treatment","Harassment and rights of engineers","Engineers as managers and leaders promoting ethical climate"]
                    },
                    {
                        unitNumber: "V",
                        title: "Global Issues",
                        topics: ["Introduction to global issues in professional ethics","Current scenario","Multinational corporations","Environmental ethics","Computer ethics","Weapon development","Engineers as managers","Consulting engineers","Engineers as expert witnesses and advisors"]
                    }
                ]
            },
            "CTBT-PCC-201": {
                name: "Object Oriented Programming with C++",
                credits: 3,
                teacher: "Dr. Sourav Dey Roy",
                type: "Core",
                units: [
                    { 
                        unitNumber: "I",
                        title: "Introduction to C++",
                        topics: ["Overview of POP","Basic introduction to OOP","Basic concepts of OOP","Benefits and applications of OOP","Structure of C++ program","Simple C++ program","Tokens: keywords, identifiers, constants","Data types: fundamental, derived and user-defined","#define keyword","Variables","Basic operators and operators in C++","Conditional statements","Control structures"]
                    },
                    {
                        unitNumber: "II",
                        title: "Functions in C++",
                        topics: ["Introduction to functions","User-defined functions","Function prototyping","Call by value","Call by reference","Inline function","Default arguments","Function overloading"]
                    },
                    {
                        unitNumber: "III",
                        title: "Classes and Objects",
                        topics: ["Introduction to classes and objects","Structure vs class","Defining a class","Inline member functions","Access specifiers","Nesting of member functions","Arrays within a class","Static data members and member functions","Array of objects","Object as function argument and returning objects","Friend function","String manipulation using objects","Constructors: copy constructor, parameterized constructor","Destructor"]
                    },
                    {
                        unitNumber: "IV",
                        title: "Operator Overloading, Type Conversion and Inheritance",
                        topics: ["Introduction to operator overloading","Rules of operator overloading","Overloading unary operators (prefix and postfix)","Overloading binary operators with and without friend function","Manipulation of string using operators","Type conversion: basic to class, class to basic, one type to another","Inheritance: introduction and defining a derived class","Types of inheritance: single, multilevel, multiple, hierarchical, hybrid","Virtual base class","Abstract classes","Introduction to containership"]
                    },
                    {
                        unitNumber: "V",
                        title: "Pointers, File Management & Exception Handling",
                        topics: ["Pointers and pointers to objects","This pointer","Virtual functions and polymorphism","Pure virtual functions","File management: file stream classes","File operations and file modes","File pointers and manipulators","Updating a file","Error handling and command line arguments","Exception handling in C++","Templates","Standard Template Library (STL)"]
                    }
                ]
            },
            "CTBT-ESC-201": {
                name: "Digital Logic Design",
                credits: 3,
                teacher: "Dr. Mampi Devi",
                type: "Core",
                units:[
                    { 
                        unitNumber: "I",
                        title: "Introduction to Digital Systems Design",
                        topics: ["Digital systems","Binary numbers","Number-base conversions","Octal and hexadecimal numbers","Complements and signed binary numbers","Binary codes","Binary storage and registers","Binary logic","Standard graphic symbols"]
                    },
                    {
                        unitNumber: "II",
                        title: "Boolean Algebra & Logic Gates",
                        topics: ["Introduction to Boolean algebra","Axiomatic definition of Boolean algebra","Basic theorems and properties of Boolean algebra","Boolean functions","Canonical and standard forms","Logic operations","Introduction to logic gates and integrated circuits","Gate level minimization","Karnaugh Map (2-variable, 3-variable and 4-variable)","POS and SOP forms","Don’t care conditions","NAND and NOR implementations","Other two-level implementations","Exclusive-OR function","Parity generation"]
                    },
                    {
                        unitNumber: "III",
                        title: "Logic Circuits",
                        topics: ["Introduction to logic circuits","Combinational logic circuits","Analysis and design procedure of CLC","Adders and subtractors (half and full)","Comparators","Multiplexers","Encoders and decoders","Sequential logic circuits","Synchronous sequential circuits","Latches and flip-flops","Asynchronous sequential circuits","Circuits with latches","Design and analysis procedures"]
                    },
                    {
                        unitNumber: "IV",
                        title: "Digital Circuits",
                        topics: ["Registers and counters","Memory and programmable logic","RAM and ROM","Programmable Logic Array (PLA)","Programmable Array Logic (PAL)","Memory decoding","Error detection and correction","Transistors","MOS and CMOS","Special characteristics","Bipolar transistor characteristics"]
                    },
                    {
                        unitNumber: "V",
                        title: "Hardware Description Languages (HDLs)",
                        topics: ["Introduction to HDL","Verilog, VHDL and SystemVerilog","Data types and naming conventions","Operators and explicit behavioural intent","Bottom-testing loop","Truth tables in HDL","HDL models of combinational circuits","VHDL process statements and variables","Writing simple testbench","Logic simulation","HDL models of registers and counters","RTL notations and descriptions","ASMs","HDL description of binary multiplier","Design with multiplexers","Switch level modelling with HDL"]
                    }
                ]
            },
            "CTBT-EMC-201": {
                name: "Fundamentals of Forensic Science and Laws",
                credits: 4,
                teacher: "Nilanjan Saha",
                type: "Core",
                units:[
                    { 
                        unitNumber: "I",
                        title: "Introduction to Forensic Science",
                        topics: ["History and development of forensic science in India","Functions of forensic science","Historical aspects of forensic science","Definitions and concepts in forensic science","Scope and need of forensic science","Contemporary disciplines and applications","Basic principles of forensic science"]
                    },
                    {
                        unitNumber: "II",
                        title: "Forensic Science Requirements",
                        topics: ["Contemporary developments in academics and practice","Advantages of scientific investigations","Tools and techniques in forensic science","Branches of forensic science","International perspectives (INTERPOL, FBI)","Duties and code of conduct of forensic scientists","Qualifications of forensic scientists","Data depiction and report writing"]
                    },
                    {
                        unitNumber: "III",
                        title: "Forensic Sciences and Government",
                        topics: ["Academic institutions involvement","Organizational setup of forensic science laboratories in India","Central and State Forensic Science Laboratories","Government Examiners of Questioned Documents","Fingerprint Bureaus","National Crime Records Bureau (NCRB)","Police and Detective Training Schools","National Investigation Agency (NIA)","CCTNS","Bureau of Police Research & Development","Directorate of Forensic Science","Mobile Crime Laboratories","Police academies","Agencies involved in criminal investigation"]
                    },
                    {
                        unitNumber: "IV",
                        title: "Forensic Sciences and Laws",
                        topics: ["Definition of law, court and judge","Basic legal terminology","Introduction to Criminal Procedure Code","FIR and difference between civil and criminal justice","Kinds and object of punishment","Primary and secondary functions of court","Classification of civil and criminal cases","Essential elements of criminal law","Hierarchy of criminal courts","Cognizable and non-cognizable offences","Bailable and non-bailable offences","Sentencing powers of Chief Judicial Magistrate","Bharatiya Sakshya Adhiniyam, 2023 (Evidence provisions)","Bharatiya Nagrik Suraksha Sanhita, 2023 (Investigation and procedure)","Bharatiya Nyaya Sanhita, 2023 (Offences: murder, conspiracy, attempt, sexual offences, counterfeiting, receiving stolen property)"]
                    },
                    {
                        unitNumber: "V",
                        title: "Cyber Laws",
                        topics: ["Introduction to computer and its components","Types of storage media","Categories of cyber crime","Cyber law and IT Act 2000 with amendments","Digital Personal Data Protection Act, 2023 (DPDP)","International cyber laws","Cyber ethics","Child Sexual Abuse Material (CSAM) in cyber domain","Acts related to social media, privacy and security","Case studies"]
                    }
                ]
            },
            "CTBT-EMC-202": {
                name: "Environment Science",
                credits: 2,
                teacher: "null",
                type: "Core",
                units:[
                    { 
                        unitNumber: "I",
                        title: "The Multidisciplinary Nature of Environmental Studies",
                        topics: ["Multidisciplinary nature of environmental studies","Concept of biosphere","Lithosphere, hydrosphere and atmosphere","Biogeochemical cycles"]
                    },
                    {
                        unitNumber: "II",
                        title: "Environment Concept",
                        topics: ["Principles and scope of ecology","Concept of ecosystem","Population and community","Biotic interactions","Biomes","Ecological succession"]
                    },
                    {
                        unitNumber: "III",
                        title: "Natural Resources",
                        topics: ["Renewable and non-renewable resources","Forest resources","Water resources","Mineral resources","Food resources","Energy resources","Land resources"]
                    },
                    {
                        unitNumber: "IV",
                        title: "Environmental Pollution",
                        topics: ["Causes, effects and control measures of air pollution","Water pollution","Soil pollution","Marine pollution","Noise pollution","Thermal pollution","Nuclear hazards"]
                    },
                    {
                        unitNumber: "V",
                        title: "Biodiversity and Its Conservation",
                        topics: ["Definition of genetic, species and ecosystem diversity","Biogeographical classification of India","Values of biodiversity: consumptive, productive, social, ethical, aesthetic and option values","Biodiversity at global, national and local levels","India as a mega-diversity nation","Hotspots of biodiversity","Threats to biodiversity: habitat loss, poaching, man-wildlife conflicts","Endangered and endemic species of India","In-situ and ex-situ conservation of biodiversity"]
                    }
                ]
            },
            "CTВТ-PCС-201L": {
                name: "Object Oriented Programming with C++ Laboratory",
                credits: 2,
                teacher: "Dr. Sourav Dey Roy",
                type: "Lab",
                units: [s] 
            },
            "CTBT-ESC-201L": {
                name: "Digital Logic Design Laboratory",
                credits: 2,
                teacher: "Dr. Mampi Devi",
                type: "Lab",
                units: [
                    {
                        experimentNumber: 1,
                        title: "Digital Logic Gates",
                        topics: ["Verify AND, OR, NAND, NOR, EX-OR, EX-NOR gates","Investigate Inverter and Buffer gates","Implementation using Universal NAND gate"]
                    },
                    {
                        experimentNumber: 2,
                        title: "Gate-Level Minimization",
                        topics: ["Two-level implementation of Boolean functions","Multi-level implementation of Boolean functions"]
                    },
                    {
                        experimentNumber: 3,
                        title: "Combinational Circuits",
                        topics: ["Design and test adders (Half and Full)","Design and test subtractors","Design and test comparators"]
                    },
                    {
                        experimentNumber: 4,
                        title: "Code Converters",
                        topics: ["Gray code to binary converter","BCD to seven segment display"]
                    },
                    {
                        experimentNumber: 5,
                        title: "MUX/DEMUX Implementation",
                        topics: ["Design and implementation of Boolean functions using Multiplexer","Design and implementation using Demultiplexer"]
                    },
                    {
                        experimentNumber: 6,
                        title: "Encoder and Decoder",
                        topics: ["Design using encoder","Design using decoder"]
                    },
                    {
                        experimentNumber: 7,
                        title: "Flip-Flops",
                        topics: ["SR flip-flop","D flip-flop","JK flip-flop","Testing and verification of flip-flop operations"]
                    },
                    {
                        experimentNumber: 8,
                        title: "Shift Registers",
                        topics: ["Design of shift registers","Serial-in Serial-out (SISO)","Serial-in Parallel-out (SIPO)","Parallel-in Serial-out (PISO)","Parallel-in Parallel-out (PIPO)","Shift registers with parallel load"]
                    },
                    {
                        experimentNumber: 9,
                        title: "Counters",
                        topics: ["Ripple counters","Synchronous counters","Decimal counter","Binary counter with parallel load"]
                    },
                    {
                        experimentNumber: 10,
                        title: "Binary Multiplier",
                        topics: ["Design of binary multiplier","Implementation and testing"]
                    },
                    {
                        experimentNumber: 11,
                        title: "HDL Implementation",
                        topics: ["Verilog/VHDL simulation","Implementation of experiments 1 to 10 using HDL"]
                    }
                ]
            }
        },
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