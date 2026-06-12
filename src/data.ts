/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Semester, ResourceFolder, ResourceFile } from './types';

// Standard Dropbox link generator
const makeDropboxLink = (fileName: string) => {
  const cleanName = encodeURIComponent(fileName.replace(/\s+/g, '_'));
  return `https://www.dropbox.com/s/fuuast_cs_resource_${cleanName}?dl=1`;
};

export const INITIAL_SEMESTERS: Semester[] = [
  {
    id: 'sem1',
    name: 'Semester 1',
    fullName: 'Semester 1',
    description: 'Foundation courses of computer science and mathematical sciences.',
    color: 'from-[#6750A4] to-[#8E78D3]', // Material Violet range
    icon: 'Layers',
    subjects: [
      {
        id: 'calculus',
        name: 'Calculus',
        description: 'Differential and Integral Calculus syllabus notes and resources.',
        directUrl: 'https://www.dropbox.com/scl/fi/x53tod13lzc05j4lzrbnx/Calculus.pdf?rlkey=cr4y652o8k8f8pb6395ba2sp0&st=6blmn52t&dl=0',
        externalType: 'file',
        folders: [],
        files: [
          {
            id: 'calculus-pdf',
            name: 'Calculus.pdf',
            type: 'pdf',
            size: '15.8 MB',
            url: 'https://www.dropbox.com/scl/fi/x53tod13lzc05j4lzrbnx/Calculus.pdf?rlkey=cr4y652o8k8f8pb6395ba2sp0&st=6blmn52t&dl=0',
            addedDate: '2026-02-15',
            semesterId: 'sem1'
          }
        ]
      },
      {
        id: 'english',
        name: 'English',
        description: 'Functional english reading materials and reference assignments.',
        directUrl: 'https://www.dropbox.com/scl/fi/8cr96tijqgonp61i6scjw/English.pdf?rlkey=w7mdzh854zulikrjvcy9l7sd1&st=u9a5jsgd&dl=0',
        externalType: 'file',
        folders: [],
        files: [
          {
            id: 'english-pdf',
            name: 'English.pdf',
            type: 'pdf',
            size: '8.4 MB',
            url: 'https://www.dropbox.com/scl/fi/8cr96tijqgonp61i6scjw/English.pdf?rlkey=w7mdzh854zulikrjvcy9l7sd1&st=u9a5jsgd&dl=0',
            addedDate: '2026-02-15',
            semesterId: 'sem1'
          }
        ]
      },
      {
        id: 'basic-electronics',
        name: 'Basic Electronics',
        description: 'Circuits, semiconductor devices, lab tasks and handbooks.',
        directUrl: 'https://www.dropbox.com/scl/fi/r7r6qrinmy204mvgey0bv/Basic.Electronics.pdf?rlkey=5ppewpxg6hffvkegutd4cw1tk&st=prf5hf8u&dl=0',
        externalType: 'file',
        folders: [],
        files: [
          {
            id: 'electronics-pdf',
            name: 'Basic.Electronics.pdf',
            type: 'pdf',
            size: '12.2 MB',
            url: 'https://www.dropbox.com/scl/fi/r7r6qrinmy204mvgey0bv/Basic.Electronics.pdf?rlkey=5ppewpxg6hffvkegutd4cw1tk&st=prf5hf8u&dl=0',
            addedDate: '2026-02-15',
            semesterId: 'sem1'
          }
        ]
      },
      {
        id: 'itc',
        name: 'ITC (Folder)',
        description: 'Introduction to Information and Communication Technology master repository folder.',
        directUrl: 'https://www.dropbox.com/scl/fo/q02tin6eg10ct1x968jlf/ANsWKRelLEOBF-ORuf7dT2g?rlkey=6btw62qdx74zqvj6n0aiymi1r&st=l9cuuuuy&dl=0',
        externalType: 'folder',
        folders: [],
        files: [
          {
            id: 'itc-folder-link',
            name: 'ITC Dropbox Shared Folder',
            type: 'link',
            size: 'Folder Link',
            url: 'https://www.dropbox.com/scl/fo/q02tin6eg10ct1x968jlf/ANsWKRelLEOBF-ORuf7dT2g?rlkey=6btw62qdx74zqvj6n0aiymi1r&st=l9cuuuuy&dl=0',
            addedDate: '2026-02-15',
            semesterId: 'sem1'
          }
        ]
      },
      {
        id: 'fop',
        name: 'FOP (Folder)',
        description: 'Fundamentals of Programming course outlines, resources and labs folder.',
        directUrl: 'https://www.dropbox.com/scl/fo/e0wcsgm6t31dj7rlu6nfu/ALHurduo_BFnqgj7uR6pQRU?rlkey=i1b1mwn0pd259c10zscrdn6qp&st=l88u7ooe&dl=0',
        externalType: 'folder',
        folders: [],
        files: [
          {
            id: 'fop-folder-link',
            name: 'FOP Dropbox Shared Folder',
            type: 'link',
            size: 'Folder Link',
            url: 'https://www.dropbox.com/scl/fo/e0wcsgm6t31dj7rlu6nfu/ALHurduo_BFnqgj7uR6pQRU?rlkey=i1b1mwn0pd259c10zscrdn6qp&st=l88u7ooe&dl=0',
            addedDate: '2026-02-15',
            semesterId: 'sem1'
          }
        ]
      }
    ]
  },
  {
    id: 'sem2',
    name: 'Semester 2',
    fullName: 'Semester 2',
    description: 'Object-Oriented methodologies, digital circuitry, and presentation skills.',
    color: 'from-[#386A20] to-[#55923F]', // Material Green
    icon: 'Terminal',
    subjects: [
      {
        id: 'dld',
        name: 'DLD (Digital Logic Design) (Folder)',
        description: 'Understand gates, Karnaugh maps, sequential and combinational logic circuits master repository.',
        directUrl: 'https://www.dropbox.com/scl/fo/vyyrbtcorc1yt0spso3xm/AMRVmnXVITKKyrrXGo-RLLQ?rlkey=fj8sodk75q0kbhvxmdv25zksp&st=fe23gi3r&dl=0',
        externalType: 'folder',
        folders: [],
        files: [
          {
            id: 'dld-folder-link',
            name: 'DLD Dropbox Shared Folder',
            type: 'link',
            size: 'Folder Link',
            url: 'https://www.dropbox.com/scl/fo/vyyrbtcorc1yt0spso3xm/AMRVmnXVITKKyrrXGo-RLLQ?rlkey=fj8sodk75q0kbhvxmdv25zksp&st=fe23gi3r&dl=0',
            addedDate: '2026-02-15',
            semesterId: 'sem2'
          }
        ]
      },
      {
        id: 'statistics',
        name: 'Statistics (Folder)',
        description: 'Probability definitions, discrete/continuous distributions, and estimation handouts.',
        directUrl: 'https://www.dropbox.com/scl/fo/99zklqlj9ox666hrcltsx/AHEmXw6UklsuKPKCwoGN2_o?rlkey=ry7phd6psq3wqh97olo4ppzn1&st=mcdwgjfj&dl=0',
        externalType: 'folder',
        folders: [],
        files: [
          {
            id: 'statistics-folder-link',
            name: 'Statistics Dropbox Shared Folder',
            type: 'link',
            size: 'Folder Link',
            url: 'https://www.dropbox.com/scl/fo/99zklqlj9ox666hrcltsx/AHEmXw6UklsuKPKCwoGN2_o?rlkey=ry7phd6psq3wqh97olo4ppzn1&st=mcdwgjfj&dl=0',
            addedDate: '2026-02-15',
            semesterId: 'sem2'
          }
        ]
      },
      {
        id: 'oop',
        name: 'OOP (Object Oriented Programming) (Folder)',
        description: 'Design classes, encapsulation, inheritance, polymorphism, and templates directory.',
        directUrl: 'https://www.dropbox.com/scl/fo/sln49bnok32953seo1hog/AGlnD3A_39u4FCFCvIsnyGw?rlkey=m051xwtqvi4em9pu0ja870pda&st=eqzn4ggr&dl=0',
        externalType: 'folder',
        folders: [],
        files: [
          {
            id: 'oop-folder-link',
            name: 'OOP Dropbox Shared Folder',
            type: 'link',
            size: 'Folder Link',
            url: 'https://www.dropbox.com/scl/fo/sln49bnok32953seo1hog/AGlnD3A_39u4FCFCvIsnyGw?rlkey=m051xwtqvi4em9pu0ja870pda&st=eqzn4ggr&dl=0',
            addedDate: '2026-02-15',
            semesterId: 'sem2'
          }
        ]
      }
    ]
  },
  {
    id: 'sem3',
    name: 'Semester 3',
    fullName: 'Semester 3',
    description: 'Data structures, Differential Equations, Discrete logic, and CAO.',
    color: 'from-[#00639A] to-[#3B96D2]', // Material Blue
    icon: 'Cpu',
    subjects: [
      {
        id: 'de',
        name: 'D.E (Differential Equations) (PDF)',
        description: 'Ordinary and partial differential equations handouts and key definitions.',
        directUrl: 'https://www.dropbox.com/scl/fi/49supa4dtypya25qesxp0/D.E.pdf?rlkey=06xgeakk3isllnsjv6sgo1zql&st=m4b63512&dl=0',
        externalType: 'file',
        folders: [],
        files: [
          {
            id: 'de-pdf',
            name: 'D.E.pdf',
            type: 'pdf',
            size: '9.8 MB',
            url: 'https://www.dropbox.com/scl/fi/49supa4dtypya25qesxp0/D.E.pdf?rlkey=06xgeakk3isllnsjv6sgo1zql&st=m4b63512&dl=0',
            addedDate: '2026-02-15',
            semesterId: 'sem3'
          }
        ]
      },
      {
        id: 'dsa',
        name: 'DSA (Data Structures & Algorithms) (PDF)',
        description: 'Standard memory structures, pointer references, sorting complex workflows.',
        directUrl: 'https://www.dropbox.com/scl/fi/q8fkt4qdaly37fp20z20f/DSA.pdf?rlkey=zh9kfh0vl1ukptz5keo3i5ol7&st=kg18zn5b&dl=0',
        externalType: 'file',
        folders: [],
        files: [
          {
            id: 'dsa-pdf',
            name: 'DSA.pdf',
            type: 'pdf',
            size: '14.2 MB',
            url: 'https://www.dropbox.com/scl/fi/q8fkt4qdaly37fp20z20f/DSA.pdf?rlkey=zh9kfh0vl1ukptz5keo3i5ol7&st=kg18zn5b&dl=0',
            addedDate: '2026-02-15',
            semesterId: 'sem3'
          }
        ]
      },
      {
        id: 'ds',
        name: 'DS (Discrete Structures) (Folder)',
        description: 'Combinatorics, graphs, logic propositions and truth table references.',
        directUrl: 'https://www.dropbox.com/scl/fo/z3kxykb6i7hb32zznj0hn/AFnuBapKEwMdcNcrtxtpoa8?rlkey=lw146j16q2e9nnwa4x2bhw69f&st=dc8tppd3&dl=0',
        externalType: 'folder',
        folders: [],
        files: [
          {
            id: 'ds-folder-link',
            name: 'DS Dropbox Shared Folder',
            type: 'link',
            size: 'Folder Link',
            url: 'https://www.dropbox.com/scl/fo/z3kxykb6i7hb32zznj0hn/AFnuBapKEwMdcNcrtxtpoa8?rlkey=lw146j16q2e9nnwa4x2bhw69f&st=dc8tppd3&dl=0',
            addedDate: '2026-02-15',
            semesterId: 'sem3'
          }
        ]
      },
      {
        id: 'cao',
        name: 'CAO (Computer Architecture & Organization) (Folder)',
        description: 'Processor organization, instruction cycles, memory hierarchies and ALU setups.',
        directUrl: 'https://www.dropbox.com/scl/fo/dq2t8vrz2cn3qdxt2dl5s/AP0BOqbihBc0sob6q3si0QY?rlkey=zwga02rc7w5bv82rf5cgg5bqq&st=k5323sae&dl=0',
        externalType: 'folder',
        folders: [],
        files: [
          {
            id: 'cao-folder-link',
            name: 'CAO Dropbox Shared Folder',
            type: 'link',
            size: 'Folder Link',
            url: 'https://www.dropbox.com/scl/fo/dq2t8vrz2cn3qdxt2dl5s/AP0BOqbihBc0sob6q3si0QY?rlkey=zwga02rc7w5bv82rf5cgg5bqq&st=k5323sae&dl=0',
            addedDate: '2026-02-15',
            semesterId: 'sem3'
          }
        ]
      }
    ]
  },
  {
    id: 'sem4',
    name: 'Semester 4',
    fullName: 'Semester 4',
    description: 'Linear Algebra, Automata, Databases, and Algorithms.',
    color: 'from-[#BF360C] to-[#E64A19]', // Deep Orange
    icon: 'Database',
    subjects: [
      {
        id: 'la',
        name: 'LA (Linear Algebra) (Folder)',
        description: 'Matrices, vector spaces, eigenvalues, and system calculations.',
        directUrl: 'https://www.dropbox.com/scl/fo/xvos5jvxac927ijphtrmx/AINWYH_Q5CHheMglpQgzIK0?rlkey=ybxe7jvagqtzjunym2pdfl4ih&st=vcthe6j8&dl=0',
        externalType: 'folder',
        folders: [],
        files: [
          {
            id: 'la-folder-link',
            name: 'Linear Algebra Dropbox Shared Folder',
            type: 'link',
            size: 'Folder Link',
            url: 'https://www.dropbox.com/scl/fo/xvos5jvxac927ijphtrmx/AINWYH_Q5CHheMglpQgzIK0?rlkey=ybxe7jvagqtzjunym2pdfl4ih&st=vcthe6j8&dl=0',
            addedDate: '2026-02-15',
            semesterId: 'sem4'
          }
        ]
      },
      {
        id: 'toa',
        name: 'TOA (Theory of Automata) (Folder)',
        description: 'Finite automata, regular expressions, context-free languages and machines.',
        directUrl: 'https://www.dropbox.com/scl/fo/ymn506xsv19xews8excwl/ANh27mpkhy6kOySaJaF1qFw?rlkey=5lo03np5w82qv60t3lxuiz7wl&st=59vjsx6v&dl=0',
        externalType: 'folder',
        folders: [],
        files: [
          {
            id: 'toa-folder-link',
            name: 'TOA Dropbox Shared Folder',
            type: 'link',
            size: 'Folder Link',
            url: 'https://www.dropbox.com/scl/fo/ymn506xsv19xews8excwl/ANh27mpkhy6kOySaJaF1qFw?rlkey=5lo03np5w82qv60t3lxuiz7wl&st=59vjsx6v&dl=0',
            addedDate: '2026-02-15',
            semesterId: 'sem4'
          }
        ]
      },
      {
        id: 'dbms',
        name: 'DBMS (Database Management Systems) (Folder)',
        description: 'Entity relationships, SQL languages, normalcy procedures and query logs.',
        directUrl: 'https://www.dropbox.com/scl/fo/e6zeun3dby15c22tj1k09/ABU43kS6tB4hQOb9rO1h60o?rlkey=xh0o7hwc89cub3ih01dxetmlv&st=qnp76x64&dl=0',
        externalType: 'folder',
        folders: [],
        files: [
          {
            id: 'dbms-folder-link',
            name: 'DBMS Dropbox Shared Folder',
            type: 'link',
            size: 'Folder Link',
            url: 'https://www.dropbox.com/scl/fo/e6zeun3dby15c22tj1k09/ABU43kS6tB4hQOb9rO1h60o?rlkey=xh0o7hwc89cub3ih01dxetmlv&st=qnp76x64&dl=0',
            addedDate: '2026-02-15',
            semesterId: 'sem4'
          }
        ]
      },
      {
        id: 'daa',
        name: 'DAA (Design & Analysis of Algorithms) (Folder)',
        description: 'Algorithm complexity, greedy approaches, dynamic programming, and paradigms.',
        directUrl: 'https://www.dropbox.com/scl/fo/5j96uzc6u0szwyg3oftl5/AAfeUYI9ZJgjUs4GQOE9r1c?rlkey=e39qkpptae1glm3vrb034zz7i&st=mm7x6jni&dl=0',
        externalType: 'folder',
        folders: [],
        files: [
          {
            id: 'daa-folder-link',
            name: 'DAA Dropbox Shared Folder',
            type: 'link',
            size: 'Folder Link',
            url: 'https://www.dropbox.com/scl/fo/5j96uzc6u0szwyg3oftl5/AAfeUYI9ZJgjUs4GQOE9r1c?rlkey=e39qkpptae1glm3vrb034zz7i&st=mm7x6jni&dl=0',
            addedDate: '2026-02-15',
            semesterId: 'sem4'
          }
        ]
      },
      {
        id: 'accounting',
        name: 'Accounting (Folder)',
        description: 'Financial accounting systems, balance sheets, ledger sheets and records.',
        directUrl: 'https://www.dropbox.com/scl/fo/0bd761ymqckz8fheoutzn/AApGd6aJ8R89PtieZe2TMeE?rlkey=q1fypnbz7opu0bw76cflq8fxi&st=dg7rngum&dl=0',
        externalType: 'folder',
        folders: [],
        files: [
          {
            id: 'accounting-folder-link',
            name: 'Accounting Dropbox Shared Folder',
            type: 'link',
            size: 'Folder Link',
            url: 'https://www.dropbox.com/scl/fo/0bd761ymqckz8fheoutzn/AApGd6aJ8R89PtieZe2TMeE?rlkey=q1fypnbz7opu0bw76cflq8fxi&st=dg7rngum&dl=0',
            addedDate: '2026-02-15',
            semesterId: 'sem4'
          }
        ]
      }
    ]
  },
  {
    id: 'sem5',
    name: 'Semester 5',
    fullName: 'Semester 5',
    description: 'Networks, OS systems, Multivariate Calculus, planning and SE.',
    color: 'from-[#D84315] to-[#FF5722]', // Warm Orange Red
    icon: 'FolderKanban',
    subjects: [
      {
        id: 'cn',
        name: 'CN (Computer Networks) (PDF)',
        description: 'Physical layers, routing protocols, subnets and network handbooks.',
        directUrl: 'https://www.dropbox.com/scl/fi/2qz5t0q3xviz5ccbulmk8/CN.pdf?rlkey=k2vsh890zthzpuetviizt3ssl&st=kof5jqsp&dl=0',
        externalType: 'file',
        folders: [],
        files: [
          {
            id: 'cn-pdf',
            name: 'CN.pdf',
            type: 'pdf',
            size: '18.5 MB',
            url: 'https://www.dropbox.com/scl/fi/2qz5t0q3xviz5ccbulmk8/CN.pdf?rlkey=k2vsh890zthzpuetviizt3ssl&st=kof5jqsp&dl=0',
            addedDate: '2026-02-15',
            semesterId: 'sem5'
          }
        ]
      },
      {
        id: 'os',
        name: 'OS (Operating Systems) (PDF)',
        description: 'Kernel organization, processes, threads, virtual memory and file systems.',
        directUrl: 'https://www.dropbox.com/scl/fi/ga2sy81t99jgm1dpww5ko/os.pdf?rlkey=gm8h6dmm5sq4p5vhg1it99ihl&st=9ccom3s4&dl=0',
        externalType: 'file',
        folders: [],
        files: [
          {
            id: 'os-pdf',
            name: 'OS.pdf',
            type: 'pdf',
            size: '12.4 MB',
            url: 'https://www.dropbox.com/scl/fi/ga2sy81t99jgm1dpww5ko/os.pdf?rlkey=gm8h6dmm5sq4p5vhg1it99ihl&st=9ccom3s4&dl=0',
            addedDate: '2026-02-15',
            semesterId: 'sem5'
          }
        ]
      },
      {
        id: 'mvc',
        name: 'MVC (Multivariate Calculus) (Folder)',
        description: 'Functions of multiple variables, partial derivatives, double integrals.',
        directUrl: 'https://www.dropbox.com/scl/fo/i0gebhi1pqse2tyzgzs7r/ACSPxSMXVNWLj7bXv12JDA0?rlkey=iz9z5t33cdvm6diy5nxkljzn3&st=j9f1s5li&dl=0',
        externalType: 'folder',
        folders: [],
        files: [
          {
            id: 'mvc-folder-link',
            name: 'MVC Dropbox Shared Folder',
            type: 'link',
            size: 'Folder Link',
            url: 'https://www.dropbox.com/scl/fo/i0gebhi1pqse2tyzgzs7r/ACSPxSMXVNWLj7bXv12JDA0?rlkey=iz9z5t33cdvm6diy5nxkljzn3&st=j9f1s5li&dl=0',
            addedDate: '2026-02-15',
            semesterId: 'sem5'
          }
        ]
      },
      {
        id: 'spm',
        name: 'SPM (Software Project Management) (Folder)',
        description: 'Requirements gathering, estimations, risk planning and cost allocations.',
        directUrl: 'https://www.dropbox.com/scl/fo/9g8nuvid38ssie8a8lbdq/APwO3D90do8X57__IOBgAJo?rlkey=1ft8cy3m9n833x5j86gp4fs2h&st=7t7m0c43&dl=0',
        externalType: 'folder',
        folders: [],
        files: [
          {
            id: 'spm-folder-link',
            name: 'SPM Dropbox Shared Folder',
            type: 'link',
            size: 'Folder Link',
            url: 'https://www.dropbox.com/scl/fo/9g8nuvid38ssie8a8lbdq/APwO3D90do8X57__IOBgAJo?rlkey=1ft8cy3m9n833x5j86gp4fs2h&st=7t7m0c43&dl=0',
            addedDate: '2026-02-15',
            semesterId: 'sem5'
          }
        ]
      },
      {
        id: 'se',
        name: 'SE (Software Engineering) (Folder)',
        description: 'Design layouts, class schemas, verification processes and deployment stages.',
        directUrl: 'https://www.dropbox.com/scl/fo/n4za4h9vo7ukskczbw9x6/AFy-40pCqCuaoYZJIX3Ezh0?rlkey=xhsdye8jmsz41nj9g2b39tyfb&st=citd0iad&dl=0',
        externalType: 'folder',
        folders: [],
        files: [
          {
            id: 'se-folder-link',
            name: 'SE Dropbox Shared Folder',
            type: 'link',
            size: 'Folder Link',
            url: 'https://www.dropbox.com/scl/fo/n4za4h9vo7ukskczbw9x6/AFy-40pCqCuaoYZJIX3Ezh0?rlkey=xhsdye8jmsz41nj9g2b39tyfb&st=citd0iad&dl=0',
            addedDate: '2026-02-15',
            semesterId: 'sem5'
          }
        ]
      }
    ]
  },
  {
    id: 'sem6',
    name: 'Semester 6',
    fullName: 'Semester 6',
    description: 'Artificial Intelligence, Natural Language Processing, Numerical Computing, CC, and PP.',
    color: 'from-[#00796B] to-[#009688]', // Material Teal
    icon: 'Network',
    subjects: [
      {
        id: 'nc',
        name: 'NC (Numerical Computing) (PDF)',
        description: 'Numerical methods, estimation roots, equations, and integration schemas.',
        directUrl: 'https://www.dropbox.com/scl/fi/vnvp59zw9dqfe0a9o0poy/NC-3.pdf?rlkey=fonirg3am6z1uyszevh37u4u8&st=8gvjxvl3&dl=0',
        externalType: 'file',
        folders: [],
        files: [
          {
            id: 'nc-pdf',
            name: 'NC-3.pdf',
            type: 'pdf',
            size: '9.2 MB',
            url: 'https://www.dropbox.com/scl/fi/vnvp59zw9dqfe0a9o0poy/NC-3.pdf?rlkey=fonirg3am6z1uyszevh37u4u8&st=8gvjxvl3&dl=0',
            addedDate: '2026-02-15',
            semesterId: 'sem6'
          }
        ]
      },
      {
        id: 'cc',
        name: 'CC (Compiler Construction) (PDF)',
        description: 'Lexical analyses, parsed parameters, tree validations and translation phases.',
        directUrl: 'https://www.dropbox.com/scl/fi/otpqn79tpyg3vlyan2ax8/CC-1.pdf?rlkey=q3w3xf76tb6qcauac1grazcta&st=zibkxoay&dl=0',
        externalType: 'file',
        folders: [],
        files: [
          {
            id: 'cc-pdf',
            name: 'CC-1.pdf',
            type: 'pdf',
            size: '11.8 MB',
            url: 'https://www.dropbox.com/scl/fi/otpqn79tpyg3vlyan2ax8/CC-1.pdf?rlkey=q3w3xf76tb6qcauac1grazcta&st=zibkxoay&dl=0',
            addedDate: '2026-02-15',
            semesterId: 'sem6'
          }
        ]
      },
      {
        id: 'pp',
        name: 'PP (Professional Practices) (PDF)',
        description: 'IT laws, ethical matrices, patent validations and industry protocols.',
        directUrl: 'https://www.dropbox.com/scl/fi/io533gyy9yc4yoq7lwgwn/final-pp.pdf?rlkey=34olzfgl3anww0sa20fykia6g&st=lsn4t7qd&dl=0',
        externalType: 'file',
        folders: [],
        files: [
          {
            id: 'pp-pdf',
            name: 'final-pp.pdf',
            type: 'pdf',
            size: '7.5 MB',
            url: 'https://www.dropbox.com/scl/fi/io533gyy9yc4yoq7lwgwn/final-pp.pdf?rlkey=34olzfgl3anww0sa20fykia6g&st=lsn4t7qd&dl=0',
            addedDate: '2026-02-15',
            semesterId: 'sem6'
          }
        ]
      },
      {
        id: 'nlp',
        name: 'NLP (Natural Language Processing) (Folder)',
        description: 'Syntactic text translations, parsed layouts, classifiers and vocabulary systems.',
        directUrl: 'https://www.dropbox.com/scl/fo/tqi22atcpgt69tvkw6jf3/AIWxAgMWr0ZwRrBTfYuneeg?rlkey=jje0pzx7er0j4dsxb6up5dbig&st=rw2d4cy9&dl=0',
        externalType: 'folder',
        folders: [],
        files: [
          {
            id: 'nlp-folder-link',
            name: 'NLP Dropbox Shared Folder',
            type: 'link',
            size: 'Folder Link',
            url: 'https://www.dropbox.com/scl/fo/tqi22atcpgt69tvkw6jf3/AIWxAgMWr0ZwRrBTfYuneeg?rlkey=jje0pzx7er0j4dsxb6up5dbig&st=rw2d4cy9&dl=0',
            addedDate: '2026-02-15',
            semesterId: 'sem6'
          }
        ]
      },
      {
        id: 'ai',
        name: 'AI (Artificial Intelligence) (Folder)',
        description: 'Inference logs, learning networks, search spaces, and optimization paradigms.',
        directUrl: 'https://www.dropbox.com/scl/fo/657j928gi8n33uphh9xpx/AOyTLI8TOS22nKi3JYMibS0?rlkey=oragzaqglkp1skmm56k47r6ie&st=92gzt41y&dl=0',
        externalType: 'folder',
        folders: [],
        files: [
          {
            id: 'ai-folder-link',
            name: 'AI Dropbox Shared Folder',
            type: 'link',
            size: 'Folder Link',
            url: 'https://www.dropbox.com/scl/fo/657j928gi8n33uphh9xpx/AOyTLI8TOS22nKi3JYMibS0?rlkey=oragzaqglkp1skmm56k47r6ie&st=92gzt41y&dl=0',
            addedDate: '2026-02-15',
            semesterId: 'sem6'
          }
        ]
      }
    ]
  },
  {
    id: 'sem7',
    name: 'Semester 7',
    fullName: 'Semester 7',
    description: 'GCC Lab, GCC, Data Science, PDC, and Entrepreneurship.',
    color: 'from-[#0288D1] to-[#03A9F4]', // Material Cyan / Light Blue
    icon: 'ShieldAlert',
    subjects: [
      {
        id: 'gcc_lab',
        name: 'GCC Lab (Grid & Cloud Computing Lab) (Folder)',
        description: 'Virtualization setups, containers, orchestration frameworks, and cluster tasks.',
        directUrl: 'https://www.dropbox.com/scl/fo/duzfghpjgnjlsdop86ju9/AMV9erSDdL5g30HYqmqhe8I?rlkey=em4vzyd1v59o4rl6bkcy3l5k9&st=y7urg4t8&dl=0',
        externalType: 'folder',
        folders: [],
        files: [
          {
            id: 'gcc-lab-folder-link',
            name: 'GCC Lab Dropbox Shared Folder',
            type: 'link',
            size: 'Folder Link',
            url: 'https://www.dropbox.com/scl/fo/duzfghpjgnjlsdop86ju9/AMV9erSDdL5g30HYqmqhe8I?rlkey=em4vzyd1v59o4rl6bkcy3l5k9&st=y7urg4t8&dl=0',
            addedDate: '2026-02-15',
            semesterId: 'sem7'
          }
        ]
      },
      {
        id: 'gcc',
        name: 'GCC (Grid & Cloud Computing) (Folder)',
        description: 'Symmetric setups, cloud structures, virtual layouts, and thread nodes.',
        directUrl: 'https://www.dropbox.com/scl/fo/rpyr4lidehy2feuzryhmy/AGqB2VeoZjk45AxJUydyw6o?rlkey=ljp4pi5ju9ru9mvu6wpnppibz&st=xvb49b8i&dl=0',
        externalType: 'folder',
        folders: [],
        files: [
          {
            id: 'gcc-folder-link',
            name: 'GCC Dropbox Shared Folder',
            type: 'link',
            size: 'Folder Link',
            url: 'https://www.dropbox.com/scl/fo/rpyr4lidehy2feuzryhmy/AGqB2VeoZjk45AxJUydyw6o?rlkey=ljp4pi5ju9ru9mvu6wpnppibz&st=xvb49b8i&dl=0',
            addedDate: '2026-02-15',
            semesterId: 'sem7'
          }
        ]
      },
      {
        id: 'ds_folder',
        name: 'Data Science (Folder)',
        description: 'Regression setups, data models, clusters, and dataset repositories.',
        directUrl: 'https://www.dropbox.com/scl/fo/1wv7whwk1uieesb7uijz0/AIXrWHUg0KuMMqJJ7MmNGhs?rlkey=v0jc0slcegettuiiepqu6u1bw&st=khc3dw6e&dl=0',
        externalType: 'folder',
        folders: [],
        files: [
          {
            id: 'ds-folder-link',
            name: 'Data Science Dropbox Shared Folder',
            type: 'link',
            size: 'Folder Link',
            url: 'https://www.dropbox.com/scl/fo/1wv7whwk1uieesb7uijz0/AIXrWHUg0KuMMqJJ7MmNGhs?rlkey=v0jc0slcegettuiiepqu6u1bw&st=khc3dw6e&dl=0',
            addedDate: '2026-02-15',
            semesterId: 'sem7'
          }
        ]
      },
      {
        id: 'pdc',
        name: 'PDC (Parallel & Distributed Computing) (Folder)',
        description: 'Message passing frameworks, thread calculations, parallel architectures, and processes.',
        directUrl: 'https://www.dropbox.com/scl/fo/g93znxnspqslhamm2mp66/AAfsZYYCC4lY27NITnaNheg?rlkey=pa8f8ri4dmg2jdw2h3gp1yaob&st=2iim5316&dl=0',
        externalType: 'folder',
        folders: [],
        files: [
          {
            id: 'pdc-folder-link',
            name: 'PDC Dropbox Shared Folder',
            type: 'link',
            size: 'Folder Link',
            url: 'https://www.dropbox.com/scl/fo/g93znxnspqslhamm2mp66/AAfsZYYCC4lY27NITnaNheg?rlkey=pa8f8ri4dmg2jdw2h3gp1yaob&st=2iim5316&dl=0',
            addedDate: '2026-02-15',
            semesterId: 'sem7'
          }
        ]
      },
      {
        id: 'entrepreneurship',
        name: 'Entrepreneurship (Folder)',
        description: 'Business plan frameworks, innovation ventures, marketing plans, and startup strategies.',
        directUrl: 'https://www.dropbox.com/scl/fo/ci55hk6eivq9p4ono1eje/AHsSf6bfUTSr98Zr0c05vzQ?rlkey=v680vvjgooq7pt5uv4z3ms6tv&st=a6vipan7&dl=0',
        externalType: 'folder',
        folders: [],
        files: [
          {
            id: 'entrepreneurship-folder-link',
            name: 'Entrepreneurship Dropbox Shared Folder',
            type: 'link',
            size: 'Folder Link',
            url: 'https://www.dropbox.com/scl/fo/ci55hk6eivq9p4ono1eje/AHsSf6bfUTSr98Zr0c05vzQ?rlkey=v680vvjgooq7pt5uv4z3ms6tv&st=a6vipan7&dl=0',
            addedDate: '2026-06-11',
            semesterId: 'sem7'
          }
        ]
      }
    ]
  },
  {
    id: 'sem8',
    name: 'Semester 8',
    fullName: 'Semester 8',
    description: 'Human Computer Interaction, Wireless Networks, and Business Administration.',
    color: 'from-[#5D4037] to-[#795548]', // Material Brown
    icon: 'GraduationCap',
    subjects: [
      {
        id: 'hci',
        name: 'HCI (Human Computer Interaction) (Folder)',
        description: 'User-centered design methodologies, cognitive psychology and interactive prototyping.',
        directUrl: 'https://www.dropbox.com/scl/fo/ie6a5e6vgjw39i7scv6x0/AKsfv3OEmxP28X7JhBS2tk0?rlkey=hvuh6lqafzm7cfm7n28dvhvsg&st=x8jrdjp9&dl=0',
        externalType: 'folder',
        folders: [],
        files: [
          {
            id: 'hci-folder-link',
            name: 'HCI Dropbox Shared Folder',
            type: 'link',
            size: 'Folder Link',
            url: 'https://www.dropbox.com/scl/fo/ie6a5e6vgjw39i7scv6x0/AKsfv3OEmxP28X7JhBS2tk0?rlkey=hvuh6lqafzm7cfm7n28dvhvsg&st=x8jrdjp9&dl=0',
            addedDate: '2026-02-15',
            semesterId: 'sem8'
          }
        ]
      },
      {
        id: 'wireless_networks',
        name: 'Wireless Networks (Folder)',
        description: 'Mobile communications, routing protocols, cellular architectures and architectures.',
        directUrl: 'https://www.dropbox.com/scl/fo/hns3w43y5fe98imlw60eg/AC66_bn98rptDAG_Az3zzpo?rlkey=skvttjatxqbppcq3bcfg9l4ty&st=yhzrz8xn&dl=0',
        externalType: 'folder',
        folders: [],
        files: [
          {
            id: 'wireless-networks-folder-link',
            name: 'Wireless Networks Dropbox Shared Folder',
            type: 'link',
            size: 'Folder Link',
            url: 'https://www.dropbox.com/scl/fo/hns3w43y5fe98imlw60eg/AC66_bn98rptDAG_Az3zzpo?rlkey=skvttjatxqbppcq3bcfg9l4ty&st=yhzrz8xn&dl=0',
            addedDate: '2026-02-15',
            semesterId: 'sem8'
          }
        ]
      },
      {
        id: 'business_admin',
        name: 'Business Administration (Folder)',
        description: 'Corporate planning strategies, financial frameworks, and resource managements.',
        directUrl: 'https://www.dropbox.com/scl/fo/na3c69eqrvyafzaxovo6j/AHIjDLbydfYC1NSBwMsZ34s?rlkey=t21zvf86ylv5w3nhv4mjp4kzo&st=pq4fq51y',
        externalType: 'folder',
        folders: [],
        files: [
          {
            id: 'business-admin-folder-link',
            name: 'Business Administration Dropbox Shared Folder',
            type: 'link',
            size: 'Folder Link',
            url: 'https://www.dropbox.com/scl/fo/na3c69eqrvyafzaxovo6j/AHIjDLbydfYC1NSBwMsZ34s?rlkey=t21zvf86ylv5w3nhv4mjp4kzo&st=pq4fq51y',
            addedDate: '2026-02-15',
            semesterId: 'sem8'
          }
        ]
      },
      {
        id: 'fyp',
        name: 'FYP (Final Year Project) (Folder)',
        description: 'Final Year Project resources, guidelines, proposals, templates and documentation files.',
        directUrl: 'https://www.dropbox.com/scl/fo/0fmbw80gytfvpjrtacrlp/ANmx_iZhF8ikTKDM9NrMkNQ?rlkey=e0dhmsa5eojpfanurbf08hyvb&st=v732chwa&dl=0',
        externalType: 'folder',
        folders: [],
        files: [
          {
            id: 'fyp-folder-link',
            name: 'FYP Dropbox Shared Folder',
            type: 'link',
            size: 'Folder Link',
            url: 'https://www.dropbox.com/scl/fo/0fmbw80gytfvpjrtacrlp/ANmx_iZhF8ikTKDM9NrMkNQ?rlkey=e0dhmsa5eojpfanurbf08hyvb&st=v732chwa&dl=0',
            addedDate: '2026-06-04',
            semesterId: 'sem8'
          }
        ]
      }
    ]
  }
];

// Helper functions for easy searching and browsing

// 1. Recursive finder to list all files in any folder tree
export const getAllFiles = (folder: ResourceFolder): ResourceFile[] => {
  let files: ResourceFile[] = [];
  if (folder.files) {
    files = [...files, ...folder.files];
  }
  if (folder.folders) {
    for (const sub of folder.folders) {
      files = [...files, ...getAllFiles(sub)];
    }
  }
  return files;
};

// 2. Global search across all semesters, subjects, folders, and files
export interface GlobalSearchResult {
  file: ResourceFile;
  semesterName: string;
  semesterId: string;
  subjectName: string;
  folderPath: string[];
}

export const searchAllSemesters = (semesters: Semester[], query: string): GlobalSearchResult[] => {
  if (!query || query.trim().length === 0) return [];
  const cleanQuery = query.toLowerCase().trim();
  const results: GlobalSearchResult[] = [];

  for (const sem of semesters) {
    for (const subject of sem.subjects) {
      const searchInFolder = (folder: ResourceFolder, currentPath: string[]) => {
        if (folder.files) {
          for (const file of folder.files) {
            if (
              file.name.toLowerCase().includes(cleanQuery) ||
              folder.name.toLowerCase().includes(cleanQuery) ||
              subject.name.toLowerCase().includes(cleanQuery)
            ) {
              results.push({
                file,
                semesterName: sem.name,
                semesterId: sem.id,
                subjectName: subject.name,
                folderPath: [...currentPath, folder.name]
              });
            }
          }
        }
        if (folder.folders) {
          for (const sub of folder.folders) {
            searchInFolder(sub, [...currentPath, folder.name]);
          }
        }
      };

      searchInFolder(subject, []);
    }
  }
  return results;
};
