# Data science for economists

## Lecture outline and quicklinks

1. Introduction: Motivation, software installation, and data visualization \[[Slides](https://raw.githack.com/uo-ec607/lectures/master/01-intro/01-Intro.html)\]
2. Version control with Git(Hub) \[[Slides](https://raw.githack.com/uo-ec607/lectures/master/02-git/02-Git.html)\]
3. Learning to love the shell \[[Slides](https://raw.githack.com/uo-ec607/lectures/master/03-shell/03-shell.html)\]
4. R language basics \[[Slides](https://raw.githack.com/uo-ec607/lectures/master/04-rlang/04-rlang.html)\]
5. Data wrangling & tidying: (1) Tidyverse \[[Slides](https://raw.githack.com/uo-ec607/lectures/master/05-tidyverse/05-tidyverse.html)\] and (2) data.table \[[Slides](https://raw.githack.com/uo-ec607/lectures/master/05-datatable/05-datatable.html)\]
6. Webscraping: (1) Server-side and CSS \[[Notebook](https://raw.githack.com/uo-ec607/lectures/master/06-web-css/06-web-css.html)\]
7. Webscraping: (2) Client-side and APIs \[[Notebook](https://raw.githack.com/uo-ec607/lectures/master/07-web-apis/07-web-apis.html)\]
8. Regression analysis in R \[[Notebook](https://raw.githack.com/uo-ec607/lectures/master/08-regression/08-regression.html)\]
9. Spatial analysis in R \[[Notebook](https://raw.githack.com/uo-ec607/lectures/master/09-spatial/09-spatial.html)\]
10. Functions in R: (1) Introductory concepts \[[Notebook](https://raw.githack.com/uo-ec607/lectures/master/10-funcs-intro/10-funcs-intro.html)\]
11. Functions in R: (2) Advanced concepts \[[Notebook](https://raw.githack.com/uo-ec607/lectures/master/11-funcs-adv/11-funcs-adv.html)\]
12. Parallel programming \[[Notebook](https://raw.githack.com/uo-ec607/lectures/master/12-parallel/12-parallel.html)\]
13. Docker \[[rOpenSci tutorial](http://ropenscilabs.github.io/r-docker-tutorial/)\]
14. Cloud computing with Google Compute Engine \[[Notebook](https://raw.githack.com/uo-ec607/lectures/master/14-gce/14-gce.html)\]
15. High performance computing (UO Talapas cluster) \[[Slides](https://docs.google.com/presentation/d/146u3W0J0ytGYBq7MZBOoE6wdbkEUrMIV-Fg5N3Cnsls/edit?usp=sharing) from Nick Maggio guest lecture.\]
16. Databases: SQL(ite) and BigQuery \[[Notebook](https://raw.githack.com/uo-ec607/lectures/master/16-databases/16-databases.html)\]
17. Spark \[[Notebook](https://raw.githack.com/uo-ec607/lectures/master/17-spark/17-spark.html)\]
18. Machine learning: (1)
19. Machine learning: (2)

## Details

This is a graduate course taught by [Grant McDermott](http://grantmcdermott.com) at the University of Oregon. Here is the course description, taken from the [syllabus](https://github.com/uo-ec607/syllabus/blob/master/syllabus.pdf):

> This seminar is targeted at economics PhD students and will introduce you to the modern data science toolkit. While some material will likely overlap with your other quantitative and empirical methods courses, this is not just another econometrics course. Rather, my goal is bring you up to speed on the practical tools and techniques that I feel will most benefit your dissertation work and future research career. This includes seemingly mundane skills, generally excluded from the core graduate curriculum, which are nevertheless *essential* to any scientific project. We will cover topics like version control (Git) and project management; data acquisition, cleaning and visualization; efficient programming; and tools for big data analysis (e.g. relational databases, cloud computation and machine learning). **In short, we will cover things that I wish someone had taught me when I was starting out in graduate school.** While I will occasionally draw on examples from own research (environmental economics), the tools and methods apply broadly. Students from other fields and specialisations are thus welcome to register.

Please do read the rest of the [syllabus](https://github.com/uo-ec607/syllabus/blob/master/syllabus.pdf) before you go through the lectures. This will detail software requirements and installation, and give you a better sense of the full aims and scope of the course. I also have an "FAQ" section at the end that covers frequently asked questions (or, at least, potentially asked questions). Speaking of which, here follow answers to some questions that are more specifically related to this repo.

## FAQ

### How do I download this material and keep up to date with any changes?

Please note that this is a work in progress, with new material being added every week. 

If you just want to read the lecture slides or HTML notebooks in your browser, then you should simply scroll up to the [Lecture outline and quicklinks](https://github.com/uo-ec607/lectures#lecture-outline-and-quicklinks) section at the top of this page. Completed lectures will be hyperlinked as soon as they have been added. Remember to check back in regularly to get any updates. Or, you can watch or star the repo to get notified automatically.

If you actually want to run the analysis and code on your own system (highly recommended), then you will need to download the material to your local machine. The best way to do this is to clone the repo via Git and then pull regularly to get updates. Please take a look at [these slides](https://raw.githack.com/uo-ec607/lectures/master/02-git/02-Git.html) if you are unfamiliar with Git or are unsure how to do any of that. Once that's done, you will find each lecture contained in a numbered folder (e.g. `01-intro`). The lectures themselves are written in R Markdown and then exported to HMTL format. Click on the HTML files if you just want to view the slides or notebooks.

### I've spotted a mistake or would like to contribute

Please [open a new issue](https://help.github.com/articles/creating-an-issue/). Better yet, please fork the repo and [submit an upstream pull request](https://help.github.com/articles/creating-a-pull-request-from-a-fork/). I'm very grateful for any contributions, but may be slow to respond while this course is still be developed. Similarly, I am unlikely to help with software troubleshooting or conceptual difficulties for non-enrolled students. Others may feel free to jump in, though.

### Can I use/adapt your material for a similar course that I'm teaching?

Sure. That's partly why I have made everything publicly available. I only ask two favours. 1) Please let me know ([email](mailto:grantmcd@uoregon.edu)/[Twitter](https://twitter.com/grant_mcdermott)) if you do use material from this course, or have found it useful in other ways. 2) An acknowledgment somewhere in your own syllabus or notes would be much appreciated.

### Are you willing to teach a (condensed) version of this course at my institution?

Possibly. Please [contact me](mailto:grantmcd@uoregon.edu) if you would like to discuss further.

### Do you plan to turn these lecture notes into a book?

Depends on a lot things and I'm too time constrained right now... but I'm thinking about it. Preliminary [working title](https://en.wikipedia.org/wiki/My_Family_and_Other_Animals): "*Data science for economists (and other animals)*".

## License

The material in this repository is made available under the [MIT license](http://opensource.org/licenses/mit-license.php). 
