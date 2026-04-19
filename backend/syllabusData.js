const syllabusData = {
  // ==========================================================
  // 1. B.TECH - M.TECH CYBER SECURITY (Your Existing Data)
  // ==========================================================
  "btech-mtech-cybersecurity": {
    programName: "B.Tech - M.Tech Cyber Security",
    semesters: {
        "sem-1": {
            "CTBT-BSC-101": {
                name: "Engineering Mathematics-I",
                credits: 4,
                teacher: "Dr. Suman Debnath",
                type: "Core",
                units: [
                    { unitNumber: "I", title: "Differential Calculus", topics: ["Successive differentiation", "Leibniz's theorem (without proof)","Taylor's & McLaurin's series for a function of one variable","Evaluation of indeterminate forms by L'Hospital's rule","Infinite Series: Convergence of infinite Series by definition, Zero Test, Comparison Test, Ratio Test, Root Test, Alternating Series, Leibnitz's test, Power Series and radius of convergence"] },
                    { unitNumber: "II", title: "Partial Differentiation and their applications", topics: ["Functions of two variables","Limit and Continuity of function of several variables","Partial derivative, Total derivative, Chain rule","Euler's theorem for homogeneous functions and examples based on it","Jacobian, error and approximation, maxima and minima"] },
                    { unitNumber: "III", title: "Integral Calculus", topics: ["Reduction formula for sin^n x, cos^n x, sin^n x cos^m x, tan^n x, cot^n x, n ≥ 2, n ∈ N (without proof)","Beta and Gamma functions and their properties (without proof) and problems","Evaluation of improper integrals of type-I and type-II"] },
                    { unitNumber: "IV", title: "Multiple Integrals", topics: ["Double integrals, Evaluation of double integrals","Change the order of integration, change of variables by Jacobian, change into polar co-ordinates","Triple integrals, Application of multiple integrals to find areas and volumes"] },
                    { unitNumber: "V", title: "Matrices", topics: ["Types of Matrices, Elementary row operation, Rank of a matrix","Normal form, Consistency of system of simultaneous linear equations","Inverse of a matrix by Gauss Jordan method","Linearly dependent and independent vectors","Eigen values and eigen vectors, Cayley Hamilton theorem"] }
                ]
            },
            "CTBT-BSC-102": {
                name: "Engineering Physics",
                credits: 3,
                teacher: "Dr. Bapi Dey",
                type: "Core",
                units: [
                    { unitNumber: "I", title: "Laws of Motion", topics: ["Motion and its physical interpretation","Newton's laws of motion","Law of conservation of linear momentum and its applications","Equilibrium of concurrent forces","Static and kinetic friction","Laws of friction","Rolling friction","Lubrication"] },
                    { unitNumber: "II", title: "Circular Motion", topics: ["Centripetal and centrifugal force","Examples of circular motion","Projectile motion and its applications"] },
                    { unitNumber: "III", title: "Nature and Properties of Wave Optics", topics: ["Definition of wave and wave motion","Difference between longitudinal and transverse waves","Nature and properties of electromagnetic waves","Reflection, refraction, polarization and diffraction of light","Refractive index and total internal reflection","Microscopes and astronomical telescopes (reflecting and refracting) and their magnifying powers","Physical and chromatic aberrations","Propagation of sound waves and their properties"] },
                    { unitNumber: "IV", title: "Nuclear Physics", topics: ["Structure of atom","Rutherford’s model of atom","Bohr model and energy levels","Hydrogen spectrum","Composition and size of nucleus","Atomic masses","Isotopes, isobars and isotones"] },
                    { unitNumber: "V", title: "Radioactivity", topics: ["Alpha, beta and gamma particles/rays and their properties","Radioactive decay law","Mass-energy relation","Mass defect","Binding energy per nucleon and its variation with mass number","Nuclear fission and fusion"] }
                ]
            },
            "CTBT-ESC-101": {
                name: "Basics of Electrical Engineering",
                credits: 3,
                teacher: "Mr. Abhijit Das",
                type: "Core",
                units: [
                    { unitNumber: "I", title: "Fundamental and Basic Circuit Element", topics: ["Concepts of E.M.F., potential difference and current","Resistance and resistors","Effect of temperature on resistance","Temperature coefficient of resistance","Resistors in series and parallel","S.I. units of work, power and energy"] },
                    { unitNumber: "II", title: "Electromagnetism", topics: ["Magnetic effect of electric current","Cross and dot conventions","Right hand thumb rule and cork screw rule","Magnetic field of long straight conductor, solenoid and toroid","Concept of m.m.f., flux, flux density, reluctance, permeability and field strength","Units and relationships","Series and parallel magnetic circuits","Comparison of electrical and magnetic circuits","Force on current carrying conductor in magnetic field","Fleming’s left-hand rule","Faraday’s laws of electromagnetic induction","Statically and dynamically induced E.M.F.","Self and mutual inductance","Coefficient of coupling","Energy stored in magnetic field","Charging and discharging of inductor and time constant"] },
                    { unitNumber: "III", title: "Electrostatics", topics: ["Electrostatic field","Electric flux density","Electric field strength","Absolute and relative permittivity","Capacitance and capacitor","Composite dielectric capacitors","Capacitors in series and parallel","Energy stored in capacitors","Charging and discharging of capacitors and time constant"] },
                    { unitNumber: "IV", title: "D.C. Circuits & AC Fundamentals", topics: ["Classification of electrical networks","Ohm’s law","Kirchhoff’s laws and network solutions","Simplification of networks using series, parallel and star-delta conversions","Sinusoidal voltages and currents","Mathematical and graphical representation","Instantaneous, peak, average and R.M.S. values","Frequency, cycle and period","Peak factor and form factor","Phase difference, leading and lagging quantities","Phasor representation","Rectangular and polar representation of phasors"] },
                    { unitNumber: "V", title: "AC Circuits", topics: ["Single phase AC circuits","AC circuits with pure resistance, inductance and capacitance","Voltage-current phasor diagrams and waveforms"] }
                ]
            },
            "CTBT-ESC-103": {
                name: "Engineering Graphics",
                credits: 2,
                teacher: "Dr. Sandipan Debnath",
                type: "Core",
                units: [
                    { unitNumber: "I", title: "Introduction & Geometric Constructions", topics: ["Drawing instruments and accessories","Drawing layout and lettering","Drawing conventions and dimensioning rules","Geometric constructions","BIS and representative fraction","Types of graphical scales: plain, diagonal, vernier, comparative scale, scale of chords","Engineering curves: parabola, ellipse, hyperbola","Cycloidal curves: spirals, roulettes, trochoids, involutes","Classification and application of engineering curves"] },
                    { unitNumber: "II", title: "Projection of Points & Lines", topics: ["Basics of projection theory","Principles of projection","Projection methods: 1st angle and 3rd angle","Planes of projections","Symbols for method of projection","Projection of points in quadrants","Projection of lines","Lines inclined to HP and VP","True length and inclinations","Traces of lines"] },
                    { unitNumber: "III", title: "Projection of Planes & Solids", topics: ["Projection of planes","Types of planes","Projection of plane surfaces and examples","Plane perpendicular to both reference planes","Plane perpendicular to one plane and parallel to another","Plane perpendicular to one plane and inclined to the other","Plane inclined to both planes"] },
                    { unitNumber: "IV", title: "Projection & Section of Solids", topics: ["Types of solids","Projection of solids: cylinder, cone, pyramid, prism","Sections of solids","Section plane parallel to VP","Section plane parallel to HP","Section plane perpendicular to HP and inclined to VP","Section plane perpendicular to VP and inclined to HP","Intersections of solids","Methods of intersection","Development of surfaces","Methods of development","True shape of section"] },
                    { unitNumber: "V", title: "Orthographic & Isometric Projections", topics: ["Isometric projection and introduction","Classification and types of projection","1st angle and 3rd angle projection","Projection of points, lines and planes","Isometric axes","Isometric scale","Isometric projection and isometric view","Conversion of isometric to orthographic projections"] }
                ]
            },
            "CTBT-HSM-101": {
                name: "Communication Skills",
                credits: 3,
                teacher: "Dr. Debasish Acharjee",
                type: "Core",
                units: [
                    { unitNumber: "I", title: "Basic Fundamentals of Communication", topics: ["Meaning, definition, objectives and characteristics of communication","Communication process","Flow of communication","Introduction to professional communication","Principles of professional communication","Communication networks","Informal communication"] },
                    { unitNumber: "II", title: "Non-Verbal Communication", topics: ["Introduction to Non-Verbal Communication (NVC)","Components of NVC: Proxemics, Haptics, Kinesics, Chronemics","Paralinguistic features","Other forms of NVC","Importance of NVC in oral communication","Listening skills: Hearing vs Listening","Types and barriers of listening","Active vs Passive listening","Traits of a good listener"] },
                    { unitNumber: "III", title: "Writing Skills", topics: ["Paragraph development and components of paragraph","Unity, topic sentence, cohesion and coherence","Adequate development","Approaches of paragraph: Inductive, deductive and expository","Types and attributes of good paragraph","Use of transitional words","Business and technical letter writing","Informal and personal letters","Business letter: style, principles and layout","Types of letters: Inquiry, order, quotation, claim and adjustment, sales, credits and circular"] },
                    { unitNumber: "IV", title: "Verbal Communications", topics: ["Reading skills and purpose of reading","Understanding and interpreting ideas","Reading rates","Techniques of reading","Reading comprehension skills","Reasons for poor reading comprehension","Interpreting technical graphics","Conversation practice and dialogue practice","Telephonic conversation","Speaking for various purposes","Grammar and vocabulary","Parts of speech","Tenses","Active and passive voice","Confusable words"] },
                    { unitNumber: "V", title: "Language through Literature", topics: ["Selected stories from 'Wise and Otherwise' by Sudha Murthy","A Lesson in Life from a Beggar","Death without Grief","Idealists at Twenty, Realists at Forty","Think Positive, Be Happy","Crisis of Confidence","Sorry, the Line is Busy","Oh Teacher, I Salute Thee","Life is an Examination"] }
                ]
            },
            "CTBT-ESC-102": {
                name: "Programming for Problem Solving",
                credits: 3,
                teacher: "Dr. Priya Saha",
                type: "Core",
                units: [
                    { unitNumber: "I", title: "Fundamentals of Computer", topics: ["What is computer","History of computer","Block diagram of computer system","Hardware and software","Types of operating systems","Compiler and interpreter","Programming languages","Flowchart and algorithm"] },
                    { unitNumber: "II", title: "Overview of C", topics: ["History of C","Features of C","Basic structure of C program","Process of executing a C program","Character set and trigraph sequences","C tokens","Data types","Variables","Storage classes","Symbolic constants","Overflow of data","Operators","Operator precedence and associativity","Type conversions","Input and Output functions"] },
                    { unitNumber: "III", title: "Branching & Looping Statements", topics: ["Introduction to decision making","If statement and types of if statement","Switch statement","While statement","For statement","Do-while statement","Goto statement","Break and continue statements"] },
                    { unitNumber: "IV", title: "Array & Structure", topics: ["Introduction to arrays","One-dimensional array","Two-dimensional array","Multidimensional array","Limitations of array","Strings and string handling functions","Array of strings","Defining a structure","Declaring and accessing structure variables","Structure member as array","Structure variable as array","Structure within structure","Unions","Bit fields"] },
                    { unitNumber: "V", title: "Pointers and User Defined Functions", topics: ["Introduction and advantages of pointers","Declaration of pointers","Chain of pointers","Scale factor","Pointers and arrays","Pointers and structures","Advantages of functions","Elements of functions","Categories of functions","Recursion","Functions and arrays","Functions and structures","Functions and pointers"] }
                ]
            },
            "CTBT-BSC-102L": { name: "Engineering Physics Laboratory", credits: 1, teacher: "Dr. Bapi Dey", type: "Lab", units: [] },
            "CTBT-ESC-103L": { name: "Engineering Graphics Laboratory", credits: 1, teacher: "Dr. Sandipan Debnath", type: "Lab", units: [] },
            "CTBT-ESC-102L": { name: "Programming for Problem Solving Laboratory", credits: 1, teacher: "Dr. Priya Saha", type: "Lab", units: [] }
        },
        "sem-2": {
            "CTBT-BSC-201": {
                name: "Engineering Mathematics-II",
                credits: 4,
                teacher: "Dr. Suman Debnath",
                type: "Core",
                units: [
                    { unitNumber: "I", title: "Basics Statistics", topics: ["Measures of central tendency","Moments","Expectation","Dispersion","Skewness","Kurtosis","Expected value of two-dimensional random variables","Linear correlation","Correlation coefficient","Rank correlation coefficient","Regression"] },
                    { unitNumber: "II", title: "Curve Fitting", topics: ["Method of least squares","Fitting of straight lines","Fitting of second degree parabola","Fitting of more general curves"] },
                    { unitNumber: "III", title: "Probability", topics: ["Random experiment and trial","Sample point and sample space","Equally likely, mutually exclusive and exhaustive events","Classical, relative and axiomatic definitions of probability","Properties of probability","Conditional probability","Multiplicative law of probability","Independent events","Law of total probability","Bayes theorem and its applications","Binomial distribution","Poisson distribution","Normal distribution"] },
                    { unitNumber: "IV", title: "Roots of Non-Linear Equations", topics: ["Bisection method","Regula-Falsi method","Secant method","Successive approximation method","Newton-Raphson method","Rate of convergence"] },
                    { unitNumber: "V", title: "Finite Differences & Numerical Integration", topics: ["Finite differences","Interpolation","Newton’s formulae","Lagrange’s formula","Divided difference formula for unequal intervals","Newton-Cotes integration formulae","Trapezoidal rule","Simpson’s rules","Gaussian quadrature formulae (one, two and three point)"] }
                ]
            },
            "CTBT-HSM-201": {
                name: "Professional Ethics",
                credits: 3,
                teacher: "Keshu Ahlawat",
                type: "Core",
                units: [
                    { unitNumber: "I", title: "Human Values", topics: ["Morals, values and ethics","Integrity and work ethic","Service learning and civil virtue","Respect for others and living peacefully","Caring and sharing","Honesty and courage","Valuing time","Cooperation and commitment","Empathy and self-confidence","Character and spirituality","Social expectations"] },
                    { unitNumber: "II", title: "Engineering Ethics", topics: ["Senses of engineering ethics","Evolution of ethics over the years","Distinction between values and ethics","Variety of moral issues","Types of inquiry","Moral dilemmas and moral autonomy","Kohlberg’s theory","Gilligan’s theory","Consensus and controversy","Models of professional roles","Theories about right action","Self-interest","Customs and religion","Uses of ethical theories","Indian ethical traditions"] },
                    { unitNumber: "III", title: "Professional Practices in Engineering", topics: ["Codes of ethics","Plagiarism and piracy","Balanced outlook on law","Professions and norms of professional conduct","Professional conduct vs profession","Responsibilities and obligations in professional ethics","Limits of predictability and responsibilities in engineering profession","Central responsibilities of engineers","Lessons from Bhopal Gas Tragedy","Lessons from SLV-3","Lessons from Indian Space Shuttle (Wings of Fire)","Lessons from international incidents: Titanic tragedy, Chernobyl nuclear tragedy, American Airline DC-10 crash, Kansas City Hyatt Regency walkway collapse"] },
                    { unitNumber: "IV", title: "Responsibilities and Rights of Engineer", topics: ["Responsibilities and accountability in public issues (safety, hazards, risk)","Collegiality and loyalty","Obligation of loyalty and misguided loyalty","Respect for authority and its limitations","Bootlegging and collective bargaining","Commitments and convictions","Confidentiality","Occupational crime and industrial espionage","Whistle blowing and moral guidelines","Conflicts of interest","Bribes, gifts and kickbacks","Discrimination and preferential treatment","Harassment and rights of engineers","Engineers as managers and leaders promoting ethical climate"] },
                    { unitNumber: "V", title: "Global Issues", topics: ["Introduction to global issues in professional ethics","Current scenario","Multinational corporations","Environmental ethics","Computer ethics","Weapon development","Engineers as managers","Consulting engineers","Engineers as expert witnesses and advisors"] }
                ]
            },
            "CTBT-PCC-201": {
                name: "Object Oriented Programming with C++",
                credits: 3,
                teacher: "Dr. Sourav Dey Roy",
                type: "Core",
                units: [
                    { unitNumber: "I", title: "Introduction to C++", topics: ["Overview of POP","Basic introduction to OOP","Basic concepts of OOP","Benefits and applications of OOP","Structure of C++ program","Simple C++ program","Tokens: keywords, identifiers, constants","Data types: fundamental, derived and user-defined","#define keyword","Variables","Basic operators and operators in C++","Conditional statements","Control structures"] },
                    { unitNumber: "II", title: "Functions in C++", topics: ["Introduction to functions","User-defined functions","Function prototyping","Call by value","Call by reference","Inline function","Default arguments","Function overloading"] },
                    { unitNumber: "III", title: "Classes and Objects", topics: ["Introduction to classes and objects","Structure vs class","Defining a class","Inline member functions","Access specifiers","Nesting of member functions","Arrays within a class","Static data members and member functions","Array of objects","Object as function argument and returning objects","Friend function","String manipulation using objects","Constructors: copy constructor, parameterized constructor","Destructor"] },
                    { unitNumber: "IV", title: "Operator Overloading, Type Conversion and Inheritance", topics: ["Introduction to operator overloading","Rules of operator overloading","Overloading unary operators (prefix and postfix)","Overloading binary operators with and without friend function","Manipulation of string using operators","Type conversion: basic to class, class to basic, one type to another","Inheritance: introduction and defining a derived class","Types of inheritance: single, multilevel, multiple, hierarchical, hybrid","Virtual base class","Abstract classes","Introduction to containership"] },
                    { unitNumber: "V", title: "Pointers, File Management & Exception Handling", topics: ["Pointers and pointers to objects","This pointer","Virtual functions and polymorphism","Pure virtual functions","File management: file stream classes","File operations and file modes","File pointers and manipulators","Updating a file","Error handling and command line arguments","Exception handling in C++","Templates","Standard Template Library (STL)"] }
                ]
            },
            "CTBT-ESC-201": {
                name: "Digital Logic Design",
                credits: 3,
                teacher: "Dr. Mampi Devi",
                type: "Core",
                units: [
                    { unitNumber: "I", title: "Introduction to Digital Systems Design", topics: ["Digital systems","Binary numbers","Number-base conversions","Octal and hexadecimal numbers","Complements and signed binary numbers","Binary codes","Binary storage and registers","Binary logic","Standard graphic symbols"] },
                    { unitNumber: "II", title: "Boolean Algebra & Logic Gates", topics: ["Introduction to Boolean algebra","Axiomatic definition of Boolean algebra","Basic theorems and properties of Boolean algebra","Boolean functions","Canonical and standard forms","Logic operations","Introduction to logic gates and integrated circuits","Gate level minimization","Karnaugh Map (2-variable, 3-variable and 4-variable)","POS and SOP forms","Don’t care conditions","NAND and NOR implementations","Other two-level implementations","Exclusive-OR function","Parity generation"] },
                    { unitNumber: "III", title: "Logic Circuits", topics: ["Introduction to logic circuits","Combinational logic circuits","Analysis and design procedure of CLC","Adders and subtractors (half and full)","Comparators","Multiplexers","Encoders and decoders","Sequential logic circuits","Synchronous sequential circuits","Latches and flip-flops","Asynchronous sequential circuits","Circuits with latches","Design and analysis procedures"] },
                    { unitNumber: "IV", title: "Digital Circuits", topics: ["Registers and counters","Memory and programmable logic","RAM and ROM","Programmable Logic Array (PLA)","Programmable Array Logic (PAL)","Memory decoding","Error detection and correction","Transistors","MOS and CMOS","Special characteristics","Bipolar transistor characteristics"] },
                    { unitNumber: "V", title: "Hardware Description Languages (HDLs)", topics: ["Introduction to HDL","Verilog, VHDL and SystemVerilog","Data types and naming conventions","Operators and explicit behavioural intent","Bottom-testing loop","Truth tables in HDL","HDL models of combinational circuits","VHDL process statements and variables","Writing simple testbench","Logic simulation","HDL models of registers and counters","RTL notations and descriptions","ASMs","HDL description of binary multiplier","Design with multiplexers","Switch level modelling with HDL"] }
                ]
            },
            "CTBT-EMC-201": {
                name: "Fundamentals of Forensic Science and Laws",
                credits: 4,
                teacher: "Nilanjan Saha",
                type: "Core",
                units: [
                    { unitNumber: "I", title: "Introduction to Forensic Science", topics: ["History and development of forensic science in India","Functions of forensic science","Historical aspects of forensic science","Definitions and concepts in forensic science","Scope and need of forensic science","Contemporary disciplines and applications","Basic principles of forensic science"] },
                    { unitNumber: "II", title: "Forensic Science Requirements", topics: ["Contemporary developments in academics and practice","Advantages of scientific investigations","Tools and techniques in forensic science","Branches of forensic science","International perspectives (INTERPOL, FBI)","Duties and code of conduct of forensic scientists","Qualifications of forensic scientists","Data depiction and report writing"] },
                    { unitNumber: "III", title: "Forensic Sciences and Government", topics: ["Academic institutions involvement","Organizational setup of forensic science laboratories in India","Central and State Forensic Science Laboratories","Government Examiners of Questioned Documents","Fingerprint Bureaus","National Crime Records Bureau (NCRB)","Police and Detective Training Schools","National Investigation Agency (NIA)","CCTNS","Bureau of Police Research & Development","Directorate of Forensic Science","Mobile Crime Laboratories","Police academies","Agencies involved in criminal investigation"] },
                    { unitNumber: "IV", title: "Forensic Sciences and Laws", topics: ["Definition of law, court and judge","Basic legal terminology","Introduction to Criminal Procedure Code","FIR and difference between civil and criminal justice","Kinds and object of punishment","Primary and secondary functions of court","Classification of civil and criminal cases","Essential elements of criminal law","Hierarchy of criminal courts","Cognizable and non-cognizable offences","Bailable and non-bailable offences","Sentencing powers of Chief Judicial Magistrate","Bharatiya Sakshya Adhiniyam, 2023 (Evidence provisions)","Bharatiya Nagrik Suraksha Sanhita, 2023 (Investigation and procedure)","Bharatiya Nyaya Sanhita, 2023 (Offences: murder, conspiracy, attempt, sexual offences, counterfeiting, receiving stolen property)"] },
                    { unitNumber: "V", title: "Cyber Laws", topics: ["Introduction to computer and its components","Types of storage media","Categories of cyber crime","Cyber law and IT Act 2000 with amendments","Digital Personal Data Protection Act, 2023 (DPDP)","International cyber laws","Cyber ethics","Child Sexual Abuse Material (CSAM) in cyber domain","Acts related to social media, privacy and security","Case studies"] }
                ]
            },
            "CTBT-EMC-202": {
                name: "Environment Science",
                credits: 0,
                teacher: "null",
                type: "Core",
                units: [
                    { unitNumber: "I", title: "The Multidisciplinary Nature of Environmental Studies", topics: ["Multidisciplinary nature of environmental studies","Concept of biosphere","Lithosphere, hydrosphere and atmosphere","Biogeochemical cycles"] },
                    { unitNumber: "II", title: "Environment Concept", topics: ["Principles and scope of ecology","Concept of ecosystem","Population and community","Biotic interactions","Biomes","Ecological succession"] },
                    { unitNumber: "III", title: "Natural Resources", topics: ["Renewable and non-renewable resources","Forest resources","Water resources","Mineral resources","Food resources","Energy resources","Land resources"] },
                    { unitNumber: "IV", title: "Environmental Pollution", topics: ["Causes, effects and control measures of air pollution","Water pollution","Soil pollution","Marine pollution","Noise pollution","Thermal pollution","Nuclear hazards"] },
                    { unitNumber: "V", title: "Biodiversity and Its Conservation", topics: ["Definition of genetic, species and ecosystem diversity","Biogeographical classification of India","Values of biodiversity: consumptive, productive, social, ethical, aesthetic and option values","Biodiversity at global, national and local levels","India as a mega-diversity nation","Hotspots of biodiversity","Threats to biodiversity: habitat loss, poaching, man-wildlife conflicts","Endangered and endemic species of India","In-situ and ex-situ conservation of biodiversity"] }
                ]
            },
            "CTBT-PCC-201L": { 
              name: "Object Oriented Programming with C++ Laboratory", 
              credits: 1, 
              teacher: "Dr. Sourav Dey Roy", 
              type: "Lab", 
              units: [] 
            },
            "CTBT-ESC-201L": 
            { name: "Digital Logic Design Laboratory", 
              credits: 1, 
              teacher: "Dr. Mampi Devi", 
              type: "Lab", 
              units: [
                    { experimentNumber: 1, title: "Digital Logic Gates", topics: ["Verify AND, OR, NAND, NOR, EX-OR, EX-NOR gates","Investigate Inverter and Buffer gates","Implementation using Universal NAND gate"] },
                    { experimentNumber: 2, title: "Gate-Level Minimization", topics: ["Two-level implementation of Boolean functions","Multi-level implementation of Boolean functions"] },
                    { experimentNumber: 3, title: "Combinational Circuits", topics: ["Design and test adders (Half and Full)","Design and test subtractors","Design and test comparators"] },
                    { experimentNumber: 4, title: "Code Converters", topics: ["Gray code to binary converter","BCD to seven segment display"] },
                    { experimentNumber: 5, title: "MUX/DEMUX Implementation", topics: ["Design and implementation of Boolean functions using Multiplexer","Design and implementation using Demultiplexer"] },
                    { experimentNumber: 6, title: "Encoder and Decoder", topics: ["Design using encoder","Design using decoder"] },
                    { experimentNumber: 7, title: "Flip-Flops", topics: ["SR flip-flop","D flip-flop","JK flip-flop","Testing and verification of flip-flop operations"] },
                    { experimentNumber: 8, title: "Shift Registers", topics: ["Design of shift registers","Serial-in Serial-out (SISO)","Serial-in Parallel-out (SIPO)","Parallel-in Serial-out (PISO)","Parallel-in Parallel-out (PIPO)","Shift registers with parallel load"] },
                    { experimentNumber: 9, title: "Counters", topics: ["Ripple counters","Synchronous counters","Decimal counter","Binary counter with parallel load"] },
                    { experimentNumber: 10, title: "Binary Multiplier", topics: ["Design of binary multiplier","Implementation and testing"] },
                    { experimentNumber: 11, title: "HDL Implementation", topics: ["Verilog/VHDL simulation","Implementation of experiments 1 to 10 using HDL"] }
                ]
            }
        },
        "sem-3": {}, "sem-4": {}, "sem-5": {}, "sem-6": {}, "sem-7": {}, "sem-8": {}, "sem-9": {}, "sem-10": {}
    }
  },

  // ==========================================================
  // 2. B.Sc. - M.Sc. FORENSIC SCIENCE (New Data)
  // ==========================================================
  "bsc-msc-forensic": {
  programName: "B.Sc. - M.Sc. Forensic Science",
  semesters: {

    // =========================
    // SEMESTER 1 (CORRECTED)
    // =========================
    "sem-1": {
      "BSC-MJ-101": {
        name: "Introduction to Forensic Science",
        credits: 3,
        teacher: "⁠Mr. Aayush Dhaka",
        type: "Major1",
        units:[
          {unitNumber:"I",title:"History and Basic Principles of Forensic Science",topics:["History and development of forensic science in India","Functions of forensic science","Historical aspects of forensic science","Definitions and concepts in forensic science","Scope of forensic science","Contemporary disciplines of forensic science","Applications in different approaches","Need of forensic science","Basic principles of forensic science"]},
          {unitNumber:"II",title:"Functional Aspects of Forensic Science",topics:["Contemporary development in forensic science","Advantages of scientific investigations","Tools and techniques in forensic science","Branches of forensic science","International perspective of forensic science","INTERPOL and FBI setup","Code of conduct of forensic scientists","Qualifications of forensic scientists","Data depiction","Report writing"]},
          {unitNumber:"III",title:"Organizational Setup in Forensic Science",topics:["Academic institutions involvement","Organizational setup of forensic science laboratories in India","Hierarchy of central forensic science laboratories","State forensic science laboratories","Government examiners of questioned documents","Fingerprint bureaus","National Crime Records Bureau (NCRB)","Police academies and detective training schools","National Investigation Agency (NIA)","CCTNS and Bureau of Police Research & Development","Directorate of forensic science and mobile crime laboratories","Other agencies involved in criminal investigation"]}
        ]
      },
      "BSC-MJ-102": {
        name: "Crime Scene Management & Criminal Profiling",
        credits: 3,
        teacher: "⁠Ms. Kiruthiga U",
        type: "Major2",
        units:[
            {unitNumber:"I",title:"Crime Scene Evidence",topics:["Introduction to crime scene","Types of crime scene","Evaluation and processing of crime scene","Securing the crime scene","Documentation of crime scene (note making, sketching)","Searching techniques of crime scene","Processing of physical evidence","Discovery, recognition and examination of physical evidences","Collection of evidence","Safety measures for evidence collection","Preservation and packaging","Sealing, labelling and forwarding of evidence","Chain of custody","Probative value of physical evidence","Reconstruction of crime scene","Photography (SLR, DSLR, lenses, filters, films, exposure, development and printing)","Types of developers and fixers","Specialized photography (UV, IR, close-up)","Photography using scientific equipment","Role of first arriving officer","Digital imaging of crime scene","3D scanning technique","Videography of crime scene"]},
            {unitNumber:"II",title:"Physical Evidences and Crime Detection",topics:["Introduction to physical evidence","Types of physical evidence","Classification of physical evidence","Role of physical evidence in investigations and trials","Crime detection devices (UV, IR, X-rays)","Detective dyes","Neutron radiography","Speed detection devices","Basic kits and investigator kits","Tools used in mobile laboratories","Digital imaging of crime scene","3D scanning","Tele-forensic technology","Crime scene logistics and manpower management","Technology innovations in crime scene management","Case studies and report writing","National and international crime scene practices"]},
            {unitNumber:"III",title:"Criminal Profiling",topics:["Introduction to crime","Essentials of crime (actus reus and mens rea)","Causes and consequences of crime","Crimes against person and property","Types of crimes (traditional, modern, white-collar, economic, political, cyber, terrorism)","Crime and politics","Hate crimes","Transnational crimes","Offences under IPC and CrPC","History of profiling","Behavioural evidence analysis","Criminal motivation","Crime scene investigation","Victim profiling","Psychological autopsy","Sexual offences","Geographical profiling","Online criminal behaviour","Case studies"]}
        ]
      },
      "BSC-MN-103": {
        name: "General Chemistry-I",
        credits: 3,
        teacher: "Dr. Naba Kr Mandal",
        type: "Minor1",
        units:[
          {unitNumber:"I",title:"Structure and Bonding",topics:["Wave mechanics and de Broglie equation","Heisenberg uncertainty principle","Schrodinger wave equation (H atom)","Radial and angular wave functions","Quantum numbers and significance","Pauli exclusion principle","Hund’s rule","Aufbau principle and limitations","Orbital energy variation","Shapes of s, p, d, f orbitals","VB approach of H2 molecule","Molecular orbital theory","MO treatment of diatomic molecules (CO, NO)","HOMO and LUMO concept","VSEPR theory","Structure of simple molecules and ions","Ionic solids (close packing, radius ratio, coordination number)","Examples of ionic solids (NaCl, TiO2)","Metallic bonding (free electron, VB, band theory)","Weak interactions (hydrogen bonding, van der Waals)","Periodic trends (size, ionization energy, electron affinity, electronegativity, lattice and hydration energy)"]},
          {unitNumber:"II",title:"Basics of Organic Chemistry",topics:["Classification and nomenclature of organic compounds","Hybridization and shapes of molecules","Effect of hybridization on bond properties","Optical isomerism","Optical activity and specific rotation","Chirality and asymmetry","Enantiomers and diastereomers","Meso compounds","Racemic mixture and resolution","Aliphatic and aromatic hydrocarbons","Cycloalkanes","Aromaticity and Huckel rule","Molecular orbital picture of benzene"]},
          {unitNumber:"III",title:"Basics of Physical Chemistry",topics:["Kinetic theory of gases","Ideal gas laws","Collision theory (mean free path, collision diameter, number)","Real gases and van der Waals equation","Surface tension and capillary action","Experimental determination of surface tension","Temperature effect on surface tension","Viscosity of liquids","Experimental determination of viscosity","Temperature dependence of viscosity","Thermodynamics (enthalpy, heat changes at constant volume and pressure)","Heat capacities (CV, CP)","Thermodynamic quantities (w, q, ΔU, ΔH)","Isothermal and adiabatic processes","Relation between ΔU and ΔH","Temperature dependence of heat of reaction (Kirchhoff’s equation)"]}
        ]
      },
      "BSC-MN-104": {
        name: "General Physics-I",
        credits: 3,
        teacher: "Dr. Bapi Dey",
        type: "Minor2",
        units:[
          {unitNumber:"I",title:"Mechanics",topics:["Motion and its physical interpretation","Newton’s laws of motion","Conservation of linear momentum and applications","Static and kinetic friction","Laws of friction","Circular motion (centripetal and centrifugal force)","Projectile motion and applications","Simple harmonic motion (SHM)","Differential equation of SHM and solution","Kinetic energy, potential energy and total energy in SHM","Elastic and inelastic collisions","Elasticity, stress, strain","Relation between elastic constants"]},
          {unitNumber:"II",title:"Thermal Physics",topics:["Thermodynamic variables","Thermodynamic equilibrium","Zeroth law of thermodynamics","Concept of temperature","Work and heat","State functions","First law of thermodynamics and its differential form","Internal energy","Thermodynamic processes","Relation between CP and CV","Work done in isothermal and adiabatic processes","Reversible and irreversible processes","Heat engines","Carnot engine and efficiency","Kelvin-Planck and Clausius statements","Entropy","Kinetic theory of gases","Maxwell-Boltzmann distribution","Mean, RMS and most probable speeds","Mean free path","Blackbody radiation","Spectral distribution","Energy density","Stefan-Boltzmann law","Wien’s displacement law","Planck’s radiation law","Rayleigh-Jeans law"]},
          {unitNumber:"III",title:"Wave and Optics",topics:["Wave motion","Wave equation","Longitudinal and transverse waves","Plane progressive waves","Electromagnetic waves and properties","Speed of sound and its variation","Velocity of transverse waves in stretched strings","Newton’s hypothesis","Laplace correction","Electromagnetic spectrum","Interference","Reflection and refraction","Polarization","Diffraction of light","Young’s double slit experiment","Refractive index","Total internal reflection","Microscopes and telescopes","Magnifying power","Spherical and chromatic aberrations"]}
        ]
      },
      "BSC-AE-105": {
        name: "English Language Skills-I",
        credits: 2,
        teacher: "Dr. Debasish Acharya",
        type: "AEC1",
        units:[
          {unitNumber:"I",title:"English Grammar and Word Formation",topics:["Parts of speech","Articles","Tenses","Modal auxiliaries","Subject-verb agreement","Word formation"]},
          {unitNumber:"II",title:"Introduction to Reading and Writing Skills",topics:["Techniques for effective reading comprehension","Tips for reading comprehension","Sentence structures","Paragraph writing"]}
        ]
      },
      "BSC-SE-106": {
        name: "Basics of Computers",
        credits: 2,
        teacher: "Mr. Abhijit Das",
        type: "SEC1",
        units:[
          {unitNumber:"I",title:"Number Systems and Computer Fundamentals",topics:["Binary, octal, decimal and hexadecimal number systems","Conversions between number systems","Binary to decimal, decimal to binary","Binary to hexadecimal, hexadecimal to binary","Signed and unsigned binary numbers","Arithmetic, logical, relational and shift operations","ASCII and UTF","Definition and history of computers","Key terms in computer science","Hardware and software","Primary and secondary storage devices","Basics of operating system","File systems","Windows and Linux OS architecture","Computer related crimes","MS Office (Word, Excel, PowerPoint)"]},
          {unitNumber:"II",title:"Basics of Computer Networking and Internet",topics:["Definition of computer network","Components of network","Network topology and types","OSI model","TCP/IP protocol suite","Communication devices","IP and MAC addresses","Internet fundamentals","Websites and webpages","Firewalls","IDS and IPS","Network and internet related crimes"]},
          {unitNumber:"III",title:"Introduction to Biometrics",topics:["Biometric fundamentals","Biometric technologies","Biometrics vs traditional techniques","Characteristics of a good biometric system","Benefits of biometrics","Verification and identification","Biometric matching","Performance measures in biometric systems","Physiological biometrics","Behavioural biometrics"]}
        ]
      },
      "BSC-VA-107": {
        name: "Environmental Studies",
        credits: 2,
        teacher: "Dr. Singlai Thouman",
        type: "VAC1",
        units:[
          {unitNumber:"I",title:"Natural Resources and Ecosystem",topics:["Introduction and definition of environmental studies","Importance of environmental studies","Public awareness and participation","Types of natural resources","Natural resource conservation","Role of individuals in conservation","Sustainable use of resources","Case studies on forest, water and mineral resources","Concept of ecosystem","Types of ecosystems","Structure and function of ecosystem","Producers, consumers and decomposers","Energy flow in ecosystem","Food chains and food webs","Ecological pyramids","Ecological succession"]},
          {unitNumber:"II",title:"Environmental Pollution and Disaster Management",topics:["Definition of environmental pollution","Causes and effects of pollution","Control measures of air pollution","Case studies on pollution","Role of individuals in pollution prevention","Solid waste management","Municipal and hazardous waste management","Disaster management concepts","Types of disasters","Mitigation strategies for floods","Earthquakes","Cyclones","Landslides"]}
        ]
      },
      "BSC-PR-10F": {
        name: "Practical-I",
        credits: 4,
        teacher: "null",
        type: "Major3",
        units:[
          {unitNumber:"I",title:"Introduction to Forensic Science",topics:["Study history of crime cases from forensic perspective","Report writing on different crime cases","Working of Central Fingerprint Bureau and State Fingerprint Bureaus","Projects of Bureau of Police Research and Development","Code of conduct for forensic scientists"]},
          {unitNumber:"II",title:"Crime Scene Management",topics:["Report on evaluation of crime scene","Chain of custody and note taking","Reconstruction of indoor crime scene","Reconstruction of outdoor crime scene","Collection, packaging and preservation of evidence"]},
          {unitNumber:"III",title:"General Physics-I",topics:["Determination of force, velocity and acceleration","Minimum deviation of prism experiment","Refractive index using convex lens and plane mirror","Thermal conductivity by Lee and Charlton’s method","Thermo-electric EMF using thermocouple"]},
          {unitNumber:"IV",title:"General Chemistry-I",topics:["Determination of anions","Determination of cations (group 0,1,2)","Melting point of organic solids","Viscosity of sugar solution","Effect of temperature on viscosity"]}
        ]
      }
    },

    // =========================
    // SEMESTER 2 (CORRECTED)
    // =========================
    "sem-2": {
      "BSC-MJ-201": {
        name: "Criminal and Evidence Law",
        credits: 3,
        teacher: "Mr. Aayush Dhaka",
        type: "Major4",
        units:[
          {unitNumber:"I",title:"Law and Constitution of India",topics:["Concept of law","Branches of law","Structure of courts in India","Article 13 of Constitution","Jurists (Austin, Bentham, Salmond)","Civil, criminal and family law remedies","Kinds of punishment under Bharatiya Nyay Sanhita 2023","Trial courts and jurisdiction","Salient features of Bharatiya Nagarik Suraksha Sanhita 2023","Complaint and inquiry","FIR and investigation","Cognizable and non-cognizable offences","Bailable and non-bailable offences","Anticipatory bail","Trial procedures (summary, summons, warrant)"]},
          {unitNumber:"II",title:"Bharatiya Nyaya Sanhita and Evidence Law",topics:["Offences against state","Culpable homicide and murder","Rash and negligent acts causing death","Dowry death","Attempt to commit suicide and abetment","Attempt to murder","Hurt and grievous hurt","Kidnapping and abduction","Outrage of modesty, stalking, voyeurism","Rape and custodial rape","Gang rape","Sexual offences by public servant","Basic principles of evidence","Types of evidence (direct, circumstantial, documentary)","Primary and secondary evidence","Public and private documents","Dying declaration","Expert opinion and relevancy","Cross examination and re-examination","Leading questions","Refreshing memory","Investigation procedures (sec 176 etc.)","Deposition of medical witness","Magistrate identification report","Evidence of officers","Reports of scientific experts"]},
          {unitNumber:"III",title:"Special Acts and Their Provisions",topics:["Aim and object of special acts","Regulatory and enforcement authorities","Offences and punishments","NDPS Act","Essential Commodities Act","Drugs and Cosmetics Act","Explosives Substances Act","Arms Act","Dowry Prohibition Act","Prevention of Food Adulteration Act","Prevention of Corruption Act","Wildlife Protection Act","IT Act","Environment Protection Act"]}
        ]
      },
      "BSC-MJ-202": {
        name: "Fingerprint Science",
        credits: 3,
        teacher: "Dr. Pronit Biswas",
        type: "Major5",
        units:[
          {unitNumber:"I",title:"History and Basics of Fingerprints",topics:["History of fingerprint science","Functions of fingerprint bureau","Development of fingerprint science","Composition of sweat and secretion","Fingerprint pattern types","Ridge characteristics","Ridge tracing","Ridge counting"]},
          {unitNumber:"II",title:"Classification Methods of Fingerprints",topics:["Fingerprint classification systems","Henry classification system","Numerical value and symbols","Primary classification","Secondary classification","Sub-secondary classification","Final classification","NCIC classification","AFIS classification"]},
          {unitNumber:"III",title:"Development and Analysis of Fingerprints",topics:["Development and identification of fingerprints","Presentation of fingerprints","Known prints and rolled impressions","Direct or inked prints","Development of latent prints","Lifting techniques","Physical methods (powder techniques)","Chemical methods","Processing of developed prints","Fingerprint comparison and identification","Introduction to AFIS"]}
        ]
      },
      "BSC-MN-203": {
        name: "General Biology-I",
        credits: 3,
        teacher: "Dr. Vijay Kr Ravi",
        type: "Minor3",
        units:[
          {unitNumber:"I",title:"Cellular Organisation",topics:["Cell and cell organelles","Cell theory","Prokaryotic and eukaryotic cells","Nucleus and chromosomes","Plasma membrane","Endoplasmic reticulum","Lysosomes and peroxisomes","Golgi apparatus","Mitochondria and chloroplast","Cytoskeleton","Cell cycle and control","Cell division (amitosis, mitosis, meiosis)"]},
          {unitNumber:"II",title:"Introduction to Microbiology",topics:["General characteristics of bacteria","Cell structure of bacteria","Classification of bacteria","Modes of nutrition","Mycoplasma","Archaebacteria","Cyanobacteria","Fungi characteristics and classification","Viruses characteristics and classification"]},
          {unitNumber:"III",title:"Basic Genetics",topics:["Introduction to genetics","Pre-Mendelian concepts","Mendelian inheritance","Non-Mendelian inheritance","Genetic linkage","Recombination and crossing over","Chromosomal basis of inheritance","Mutations and mutagenesis","Genetic basis of sex determination","Extra-nuclear inheritance","Gene transfer (conjugation, transformation, transduction)"]}
        ]
      },
      "BSC-MN-204": {
        name: "General Physics-II",
        credits: 3,
        teacher: "Dr. Bapi Dey",
        type: "Minor4",
        units:[
          {unitNumber:"I",title:"Atomic and Nuclear Physics",topics:["Structure of atom","Rutherford model","Bohr model and energy levels","Hydrogen spectrum","Discrete energy levels and electron spin","Franck-Hertz and Stern-Gerlach experiments","Quantum numbers and significance","Pauli exclusion principle","Orbital magnetic dipole moment","Orbital, spin and total angular momentum","Vector model of atom","Composition and size of nucleus","Atomic masses, isotopes, isobars, isotones","Alpha, beta and gamma radiation","Radioactive decay law","Mass-energy relation","Mass defect and binding energy","Variation of binding energy","Nuclear fission and fusion"]},
          {unitNumber:"II",title:"Lasers and its Applications",topics:["Characteristics of laser light","Spontaneous and stimulated emission","Stimulated absorption","Einstein coefficients","Laser radiation characteristics","Population inversion","Condition for amplification","Components of laser","Optical resonator","CW and pulsed lasers","Peak power and pulse energy","Holography (formation and reconstruction)","Applications of lasers in forensic science"]},
          {unitNumber:"III",title:"Electricity and Magnetism",topics:["Electric field lines","Electric flux","Gauss law and applications","Charge distributions (spherical, cylindrical, planar)","Conservative nature of electrostatic field","Electrostatic potential","Laplace and Poisson equations","Electrostatic energy","Biot-Savart law","Applications (wire, loop)","Ampere circuital law","Magnetic field properties (curl, divergence)","Magnetic force","Torque on current loop","Faraday law","Lenz law","Self and mutual inductance","Energy in magnetic field","Maxwell equations (introduction)","Charge conservation","Displacement current"]}
        ]
      },
      "BSC-AE-205": {
        name: "English Language Skills-II",
        credits: 2,
        teacher: "Dr. Debasish Acharya",
        type: "AEC2",
        units:[
          {unitNumber:"I",title:"Atomic and Nuclear Physics",topics:["Structure of atom","Rutherford model","Bohr model and energy levels","Hydrogen spectrum","Discrete energy levels and electron spin","Franck-Hertz and Stern-Gerlach experiments","Quantum numbers and significance","Pauli exclusion principle","Orbital magnetic dipole moment","Orbital, spin and total angular momentum","Vector model of atom","Composition and size of nucleus","Atomic masses, isotopes, isobars, isotones","Alpha, beta and gamma radiation","Radioactive decay law","Mass-energy relation","Mass defect and binding energy","Variation of binding energy","Nuclear fission and fusion"]},
          {unitNumber:"II",title:"Lasers and its Applications",topics:["Characteristics of laser light","Spontaneous and stimulated emission","Stimulated absorption","Einstein coefficients","Laser radiation characteristics","Population inversion","Condition for amplification","Components of laser","Optical resonator","CW and pulsed lasers","Peak power and pulse energy","Holography (formation and reconstruction)","Applications of lasers in forensic science"]},
          {unitNumber:"III",title:"Electricity and Magnetism",topics:["Electric field lines","Electric flux","Gauss law and applications","Charge distributions (spherical, cylindrical, planar)","Conservative nature of electrostatic field","Electrostatic potential","Laplace and Poisson equations","Electrostatic energy","Biot-Savart law","Applications (wire, loop)","Ampere circuital law","Magnetic field properties (curl, divergence)","Magnetic force","Torque on current loop","Faraday law","Lenz law","Self and mutual inductance","Energy in magnetic field","Maxwell equations (introduction)","Charge conservation","Displacement current"]}
        ]
      },
      "BSC-SE-206": {
        name: "Financial Literacy",
        credits: 3,
        teacher: "Dr. Baishali Dey",
        type: "SEC2",
        units:[
          {unitNumber:"I",title:"Concept of Financial System",topics:["Overview of financial system","Components (financial institutions, markets, instruments)","Concept of investment and characteristics","Types of financial risks","Capital market (primary and secondary)","Procedure for equity investment"]},
          {unitNumber:"II",title:"Financial Products",topics:["Commercial banks, post office and insurance companies","Functions and regulatory framework","Banking products and risk-return features","Savings account, current account, term deposit, recurring deposit","PPF and other schemes","Account opening formalities","PAN card, address proof, KYC norms","ATM, debit card, credit card","Digital payment systems and apps","Types of loans (short, medium, long term, microfinance, agricultural)","Interest rates in banks and post offices","Banking complaints and ombudsman","CIBIL score"]},
          {unitNumber:"III",title:"Financial Services",topics:["Post office savings schemes","Savings bank and recurring deposit","Term deposit and monthly income scheme","Kisan Vikas Patra","NSC and PPF","Senior Citizen Savings Scheme (SCSS)","Sukanya Samriddhi Yojana (SSY/SSA)","India Post Payments Bank (IPPB)","Money transfer (money order, e-money order)","Life insurance","Term life insurance","Endowment policies","Pension policies","Health insurance","Postal and rural postal life insurance"]}
        ]
      },
      "BSC-VA-207": {
        name: "Indian Knowledge System",
        credits: 2,
        teacher: "Dr. Naba Kr Mandal",
        type: "VAC2",
        units:[
          {unitNumber:"I",title:"Roti, Makkan Kappada & Life Learning",topics:["Concept of aharakrama in ancient wisdom (Bhagavad Gita)","Importance of vastradharana sampradaya (Atharvaveda)","Methodology of vastu jnana and ancient architecture (Sthapatya Veda)","Daily habits for quality of life (Yoga Sutra, Ashtanga Yoga)","Concept of mind and goal achievement (Yogavasistha)","Concept of sthoola and sookshma world (Vedanta)","Inner and outer communication with universe (Upanishads)","Mind analysis process (Chandogya Upanishad)"]},
          {unitNumber:"II",title:"Simple Thoughts Manifestation & Way of Life with Love and Truth",topics:["Concept of manifestation in Vedas (Yajurveda)","Critical thinking development (Shvetashvatara Upanishad)","Ways of manifestation in Upanishads","Lifestyle techniques in Vedas (Muktikopanishad)","Methods of life learning","Control over emotions (Taittiriya Upanishad)"]}
        ]
      },
      "BSC-PR-208": {
        name: "Practical-II",
        credits: 3,
        teacher: "null",
        type: "Major6",
        units:[
          {unitNumber:"I",title:"Fingerprint Science",topics:["Recording plain and rolled fingerprints","Identification of fingerprint patterns","Digit classification of fingerprints","Physical methods of fingerprint detection","Use of different light sources for fingerprint development"]},
          {unitNumber:"II",title:"General Biology-I",topics:["Visualization of animal cells under microscope","Visualization of bacterial cells under microscope","Visualization of mitosis in plant cell","Isolation of bacteria from soil/water samples","Mendelian inheritance using plant seeds of different traits"]},
          {unitNumber:"III",title:"General Physics-II",topics:["Divergence and beam spot of laser","Resolving power of plane diffraction grating","Resolving power of prism","Wavelength determination using diffraction grating","Use of digital multimeter (AC/DC voltage, current, resistance, capacitance)","B-H curve and hysteresis loss","Resistance per cm and resistivity determination","Magnetic field strength in solenoid","Characteristics of series RC circuit"]}
        ]
      }
    }
  }
}
};    

module.exports = syllabusData;