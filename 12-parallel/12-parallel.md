---
title: "Data Science for Economists"
subtitle: "Lecture 12: Parallel programming"
author:
  name: Grant R. McDermott
  affiliation: University of Oregon | [EC 607](https://github.com/uo-ec607/lectures)
# date: Lecture 12  #"13 February 2020"
output: 
  html_document:
    theme: flatly
    highlight: haddock 
    # code_folding: show
    toc: yes
    toc_depth: 4
    toc_float: yes
    keep_md: true
---



*Note: This is the third of three lectures on programming. Please take a look at the [first](https://raw.githack.com/uo-ec607/lectures/master/10-funcs-intro/10-funcs-intro.html) [two](https://raw.githack.com/uo-ec607/lectures/master/11-funcs-adv/11-funcs-adv.html) lectures if you haven't yet. Nothing that we will cover here is critically dependent on these earlier lectures. However, I'm going to assume that you have a good understanding of how R functions and environments generally work. Our goal for today is to dramatically speed up our programming tasks by getting them to run in parallel.*

## Software requirements

### R packages 

- New: **parallel**, **future**, **future.apply**, **furrr**, **RhpcBLASctl**, **tictoc**
- Already used: **tidyverse**, **pbapply**, **memoise**, **here**, **hrbrthemes**

The code chunk below will install (if necessary) and load all of these packages for you. Note that the **parallel** package is bundled together with the base R installation and should already be on your system. I'm also going to call the `future::plan()` function and set the resolution to "multiprocess". Don't worry what this means right now --- I'll explain in due course --- just think of it as a convenient way to set our desired parallel programming behaviour for the rest of this document.


```r
## Load and install the packages that we'll be using today
if (!require("pacman")) install.packages("pacman")
pacman::p_load(tictoc, parallel, pbapply, future, future.apply, tidyverse, hrbrthemes, furrr, RhpcBLASctl, memoise, here)
## My preferred ggplot2 plotting theme (optional)
theme_set(hrbrthemes::theme_ipsum())

## Set future::plan() resolution strategy
plan(multiprocess)
```

*Note: If you run the above code chunk in RStudio, then you will get a warning message to the effect of:*

```
## Warning: [ONE-TIME WARNING] Forked processing ('multicore') is disabled
## in future (>= 1.13.0) when running R from RStudio, because it is
## considered unstable. Because of this, plan("multicore") will fall
## back to plan("sequential"), and plan("multiprocess") will fall back to
## plan("multisession") - not plan("multicore") as in the past. For more details,
## how to control forked processing or not, and how to silence this warning in
## future R sessions, see ?future::supportsMulticore
```

*Again, don't worry about this now. I'll explain in due course.*

## Prologue

A few lectures back, we talked about the huge difference that some relatively new packages have made to spatial analysis in R. Complex spatial operations that previously necessitated equally complex spatial objects have been superseded by much simpler and more intuitive tools. If that wasn't good enough, these new tools are also faster. We are going to see something very similar today. Parallel programming is a big and complex topic, with many potential pitfalls. However, software innovations and some amazing new(ish) packages have made it *much* easier and safer to program in parallel.^[I should emphasise that the R-core team has provided excellent support for parallel programming for over a decade. But there's no question in my mind that the barriers to entry have recently been lowered.] 

With that in mind, I'm going to structure today's lecture back-to-front. In particular, I'm going to start with some motivating examples. My primary goal is to demonstrate both the ease and immediate payoff of "going parallel". Only after convincing you of these facts will we get into some of the technical details that were abstracted away behind the scenes. The latter part of the lecture will go over parallel programming in more general terms (i.e. not R-specific) and highlight potential pitfalls that you should be aware of.

Ready? Let's go.

## Example 1

Our first motivating example is going to involve the same `slow_square()` function that we saw in the previous lecture:


```r
# library(tidyverse) ## Already loaded

## Emulate slow function
slow_square <- 
  function(x = 1) {
    x_sq <- x^2 
    df <- tibble(value=x, value_squared=x_sq)
    Sys.sleep(2)
    return(df)
    }
```

Let's iterate over this function using the standard `lapply()` method that we're all familar with by now. Note that this iteration will be executed in *serial*. I'll use the [**tictoc**](https://cran.r-project.org/web/packages/tictoc/) package to record timing.


```r
# library(tictoc) ## Already loaded

tic()
serial_ex <- lapply(1:12, slow_square) %>% bind_rows()
toc()
```

```
## 24.053 sec elapsed
```

As expected, the iteration took about 24 seconds to run because of the enforced break after every sequential iteration (i.e. `Sys.sleep(2)`). On the other hand, this means that we can easily speed things up by iterating in *parallel*.

Before continuing, it's worth pointing out that our abilty to go parallel hinges on the number of CPU cores available to us. The simplest way to obtain this information from R is with the `parallel::detectCores()` function:


```r
# future::availableCores() ## Another option
detectCores()
```

```
## [1] 12
```

So, I have 12 cores to play with on my laptop.^[A Dell Precision 5530 running Arch Linux, if you're interested.] Adjust expectations for you own system accordingly.

Okay, back to our example. I'm going to implement the parallel iteration using the [**future.apply**](https://cran.r-project.org/web/packages/future.apply/index.html) package (more on this later). Note that the parameters of the problem are otherwise unchanged.


```r
# library(future.apply)  ## Already loaded
# plan(multiprocess) ## Already set above

tic()
future_ex <- future_lapply(1:12, slow_square) %>% bind_rows()
toc()
```

```
## 2.337 sec elapsed
```

Woah, the execution time was 12 times faster! Even more impressively, look at how little the syntax changed. I basically just had to tell R that I wanted to implement the iteration in parallel (i.e. <code>**plan(multiprocess)**</code>) and slightly amend my lapply call (i.e. <code>**future_**lapply()</code>). 

Let's confirm that the output is the same.


```r
all_equal(serial_ex, future_ex)
```

```
## [1] TRUE
```

For those of you who prefer the `purrr::map()` family of functions for iteration and are feeling left out; don't worry. The [**furrr**](https://davisvaughan.github.io/furrr/index.html) package has you covered. Once again, the syntax for these parallel functions will be very little changed from their serial versions. We simply have to tell R that we want to run things in parallel with `plan(multiprocess)` and then slightly amend our map call to <code>**future_**map_df**r**()</code>.^[In this particular case, the extra "r" at the end tells future to concatenate the data frames from each iteration by *rows*.]


```r
# library(furrr)  ## Already loaded
# plan(multiprocess) ## Already set above

tic()
furrr_ex <- future_map_dfr(1:12, slow_square)
toc()
```

```
## 2.193 sec elapsed
```

How easy was that? We hardly had to change our original code and didn't have to pay a cent for all that extra performance.^[Not to flog a dead horse, but as I pointed out in the very [first lecture](https://raw.githack.com/uo-ec607/lectures/master/01-intro/01-Intro.html#26) of this course: Have you seen the price of a [Stata/MP](https://www.stata.com/statamp/) license recently? Not to mention the fact that you effectively pay *per* core...] Congratulate yourself on already being such an expert at parallel programming.

<div align="center"><iframe src="https://giphy.com/embed/ujGfBmVppmgEg" width="480" height="359" frameBorder="0" class="giphy-embed" allowFullScreen></iframe></p></div>
</br>

## Example 2

Our second motivating example will involve a more realistic and slightly more computationally-intensive case: Bootstrapping coefficient values for hypothesis testing. I'll also spend a bit more time talking about the packages we're using and what they're doing.

Start by creating a fake data set (`our_data`) and specifying a bootstrapping function (`bootstrp()`). This function will draw a sample of 10,000 observations from the the data set (with replacement), fit a regression, and then extract the coefficient on the `x` variable. Note that this coefficient estimate is expected to be around 2 given how we generated the data in the first place.


```r
## Set seed (for reproducibility)
set.seed(1234)
# Set sample size
n <- 1e6

## Generate a large data frame of fake data for a regression
our_data <- 
  tibble(x = rnorm(n), e = rnorm(n)) %>%
  mutate(y = 3 + 2*x + e)

## Function that draws a sample of 10,000 observations, runs a regression and extracts
## the coefficient value on the x variable (should be around 2).
bootstrp <- 
  function(i) {
  ## Sample the data
  sample_data <- sample_n(our_data, size = 1e4, replace = T)
  ## Run the regression on our sampled data and extract the extract the x coefficient.
  x_coef <- lm(y ~ x, data = sample_data)$coef[2]
  ## Return value
  return(tibble(x_coef = x_coef))
  }
```

### Serial implementation (for comparison)

Let's implement the function in serial first to get a benchmark for comparison.


```r
set.seed(123L) ## Optional to ensure that the results are the same

## 10,000-iteration simulation
tic()
sim_serial <- lapply(1:1e4, bootstrp) %>% bind_rows()
toc(log = TRUE)
```

```
## 19.987 sec elapsed
```

So that took about 20 seconds on my system. Not a huge pain, but let's see if we can do better by switching to a parallel (multicore) implementation. For the record, though here is a screenshot of my system monitor, showing that only one core was being used during this serial version.

![](pics/serial.png)

### Parallel implemention using the **future** ecosystem

All of the parallel programming that we've been doing so far is built on top of [Henrik Bengtsson's](https://twitter.com/henrikbengtsson) amazing [**future**](https://cran.r-project.org/web/packages/future/index.html) package. A "future" is basically a very flexible way of evaluating code and output. Among other things, this allows you to switch effortlessly between evaluating code in _serial_ or _asynchronously_ (i.e. in parallel). You simply have to set your resolution _plan_ --- "sequential", "multiprocess", "cluster", etc. --- and let future handle the implementation for you.

Here's Henrik [describing](https://cran.r-project.org/web/packages/future/vignettes/future-1-overview.html) the core idea in more technical terms:

> In programming, a _future_ is an abstraction for a _value_ that may be available at some point in the future. The state of a future can either be unresolved or resolved... Exactly how and when futures are resolved depends on what strategy is used to evaluate them. For instance, a future can be resolved using a sequential strategy, which means it is resolved in the current R session. Other strategies may be to resolve futures asynchronously, for instance, by evaluating expressions in parallel on the current machine or concurrently on a compute cluster

As I've tried to emphasise, **future** is relatively new on the scene. It is certainly not the first or only way to implement parallel processes in R. However, I think that it provides a simple and unified framework that makes it the preeminent choice. What's more, the same commands that we use here will carry over very neatly to more complicated settings involving high-performance computing clusters. We'll experience this first hand when we get to the big data section of the course.

You've probably also noted that keep referring to the "future ecosystem". This is because **future** provides the framework for other packages to implement parallel versions of their functions. The two that I am focusing on today are

1. the [**future.apply**](https://cran.r-project.org/web/packages/future.apply/index.html) package (also by Henrik), and
2. the [**furrr**](https://davisvaughan.github.io/furrr/index.html) package (an implementation for **purrr** by [Davis Vaughan](https://twitter.com/dvaughan32)).

In both cases, we start by setting the plan for resolving the future evaluation. I recommend `plan(multiprocess)`, which is a convenient way of telling the package to choose the optimal parallel strategy for our particular system. We then call our functions --- which involve minor modifications of their serial equivalents --- and let future magic take care of everything else.

#### 1) future.apply

Here's the `future.apply::future_lapply()` parallel implementation. Note that I'm adding the `future.seed=123L` option just to ensure that the results are the same. This is not necessary, though.


```r
# library(future.apply)  ## Already loaded
# plan(multiprocess) ## Already set above

## 10,000-iteration simulation
tic()
sim_future <- future_lapply(1:1e4, bootstrp, future.seed=123L) %>% bind_rows()
toc()
```

```
## 5.176 sec elapsed
```

#### 2) furrr

And here's the `furrr::future_map_dfr()` implementation. Similar to the above, note that I'm only adding the `.options=future_options(seed=123L)` option to ensure that the output is exactly the same.


```r
# library(furrr)  ## Already loaded
# plan(multiprocess) ## Already set above

## 10,000-iteration simulation
tic()
sim_furrr <- future_map_dfr(1:1e4, bootstrp, .options=future_options(seed=123L))
toc()
```

```
## 5.254 sec elapsed
```

### Results

As expected, we dramatically cut down on total computation time by going parallel. Note, however, that the parallel improvements for this example didn't scale linearly with the number of cores on my system (i.e. 12). The reason has to do with the *overhead* of running the parallel implementations --- a topic that I cover in more depth toward the bottom of this document. Again for the record, here is a screenshot showing that all of my cores were now being used during these parallel implementations.

![](pics/parallel.png)

While it wasn't exactly hard work, I think we deserve to see the results of our bootstrapping exercise in nice plot form. I'll use the `sim_furrr` results data frame for this, although it doesn't matter since they're all the same. As you can see, the estimated coefficient values are tightly clustered around our simulated mean of 2.


```r
sim_furrr %>%
  ggplot(aes(x_coef)) +
  geom_density(col=NA, fill="gray25", alpha=0.3) +
  geom_vline(xintercept=2, col="red") +
  labs(
    title = "Bootstrapping example",
    x="Coefficient values", y="Density",
    caption = "Notes: Density based on 10,000 draws with sample size of 10,000 each."
    )
```

![](12-parallel_files/figure-html/x_coef-1.png)<!-- -->


### Other parallel options

Futures are not the only game in town for parallel programming in R. One other option that I want to mention very briefly is the [**pbapply**](https://github.com/psolymos/pbapply) package. As we saw during the first programming lecture, this package provides a lightweight wrapper on the *apply functions that adds a progress bar. However, the package also adds a very convenient option for multicore implementation. You basically just have to add <code>cl=CORES</code> to the call. While it doesn't rely on futures, **pbapply** also takes care of all the OS-specific overhead for you. See [here](http://peter.solymos.org/code/2016/09/11/what-is-the-cost-of-a-progress-bar-in-r.html) for an interesting discussion on what's happening behind the scenes.

*Note: You will need to run this next chunk interactively to see the progress bar. As an aside, [furrr also supports progress bars](https://github.com/DavisVaughan/furrr#progress-bars).*


```r
set.seed(123) ## Optional to ensure results are exactly the same.

# library(pbapply) ## Already loaded

## 10,000-iteration simulation
tic()
sim_pblapply <- pblapply(1:1e4, bootstrp, cl = parallel::detectCores()) %>% bind_rows()
toc()
```

```
## 5.042 sec elapsed
```

## General parallel programming topics

Motivating examples out of the way, let's take a look underneath the hood. I want to emphasise that this section is more "good to know" than "need to know". Even if you take nothing else away from rest of this lecture, you are already well placed to begin implementing parallel functions at a much larger scale.

And yet... while you don't *need* to know the next section in order to program in parallel in R, getting a solid grasp of the basics is valuable. It will give you a better understanding of how parallel programming works in general and help you to appreciate how much **future** and co. are doing behind the scenes for you. It will also help you to understand why the same code runs faster on some systems than others, and avoid some common pitfalls.

### Terminology

I'll start by clearing up some terminology.

- **Socket:** The physical connection on your computer that houses the processor. Most work and home computers --- even very high-end ones --- only have one socket and, thus, one processor. However, they can have multiple cores. Speaking of which...
- **Core:** The part of the processor that actually performs the computation. Back in the day, processors were limited to a single core. However, most modern processors now house multiple cores. Each of these cores can perform entirely separate and independent computational processes.
- **Process:** A single instance of a running task or program (R, Dropbox, etc). A single core can only run one process at a time. However, it may give the appearance of doing more than that by efficiently scheduling between them. Speaking of which...
- **Thread:** A component or subset of a process that can, inter alia, share memory and resources with other threads. We'll return to this idea as it applies to *hyperthreading* in a few paragraphs.
- **Cluster:** A collection of objects that are capable of hosting cores. This could range from a single socket (on your home computer) to an array of servers (on a high-performance computing network).

You may wondering where the much-referenced **CPU** (i.e. central processing unit) fits into all of this. Truth be told, the meaning of CPU has evolved with the advent of new technology like multicore processors. For the purposes of this lecture I will use the following definition: 

$$\text{No. of CPUs} = \text{No. of sockets} \times \text{No. of physcial cores} \times \text{No. of threads per core}$$

If nothing else, this is consistent with the way that my Linux system records information about CPU architecure via the [lscpu](https://linux.die.net/man/1/lscpu) shell command: 


```bash
$ ## Only works on Linux
$ lscpu | grep -E '^Thread|^Core|^Socket|^CPU\('
```

```
## CPU(s):                          12
## Thread(s) per core:              2
## Core(s) per socket:              6
## Socket(s):                       1
```

Note that the headline "CPU(s)" number is the same that I got from running `parallel::detectCores()` earlier (i.e. 12). 

### A bit more about logical cores and hyperthreading

Logical cores extend or emulate the ability of physical cores to perform additional tasks. The most famous example is Intel's [**hyperthreading**](https://en.wikipedia.org/wiki/Hyper-threading) technology, which allows a single core to switch very rapidly between two different tasks. This mimics the appearance and performance (albeit to a lesser extent) of an extra physical core. You may find [this YouTube video](https://www.youtube.com/watch?v=mSZpDF-zUoI&) helpful for understanding the difference in more depth, including a nice analogy involving airport security lines.

Taking a step back, you don't have to worry too much about the difference between physical and logical (hyperthreaded) cores for the purpose of this lecture. R doesn't care whether you run a function on a physical core or a logical one. Both will work equally well. (Okay, the latter will be a little slower.) Still, if you are interested in determining the number of physical cores versus logical cores on your system, then there are several ways to this from R. For example, you can use the [RhpcBLASctl package](https://cran.r-project.org/web/packages/RhpcBLASctl/index.html).


```r
# library(RhpcBLASctl) ## Already loaded

get_num_procs() ## No. of all cores (including logical/hyperthreaded)
```

```
## [1] 12
```

```r
get_num_cores() ## No. of physical cores only
```

```
## [1] 6
```

### Forking vs Sockets

As I keep saying, it's now incredibly easy to run parallel programs in R. The truth is that it has actually been easy to do so for a long time... but the implementation used to vary by operating system. In particular, simple parallel implementations that worked perfectly well on Linux or Mac didn't work on Windows (which required a lot more overhead). For example, take a look at the [help documentation](https://stat.ethz.ch/R-manual/R-devel/library/parallel/html/mclapply.html) for the `parallel::mclapply()` function, which has been around since 2011. If you did so, you would see a warning that `mclapply()` *"relies on forking and hence is not available on Windows"*.

Now, we clearly didn't encounter any OS-specific problems when we ran the parallel versions of our motivating examples above. The same code worked for everyone, including anyone using Windows. ~~*Loud booing.*~~ What was happening behind the scenes is that the **future** (and **pbapply**) packages automatically handled any complications for us. The parallel functions were being executed in a way that was optimised for each person's OS.

But what is "forking" and why does it matter what OS I am using anyway? Those are good questions that relate to the method of parallelization (i.e. type of cluster) that your system supports. The short version is that there are basically two ways that code can be parallelized:

- **Forking** works by cloning your entire R environment to each separate core. This includes your data, loaded packages, functions, and any other objects in your current session. This is very efficient because you don't have to worry about reproducing your "master" environment in each "worker" node. Everything is already linked, which means that you aren't duplicating objects in memory. However, forking is not supported on Windows and can also cause problems in a GUI or IDE like RStudio. 
- **Parallel sockets** (aka "PSOCKs") work by launching a new R session in each core. This means that your master environment has to be copied over and instantiated separately in each parallel node. This requires greater overhead and causes everything to run slower, since objects will be duplicated across each core. Technically, a PSOCK works by establishing a network (e.g. as if you were connected to a remote cluster), but everything is self-contained on your computer. This approach can be implemented on every system, including Windows. 

I've summarised the differences between the two approaches in the table below. The general rule of thumb is that you should use forking if it is available to you. And, indeed, this is exactly the heuristic that the future ecosystem follows via the `plan(multiprocess)` function.

| Forking        | Parallel socket         |
| ------------- |-------------|
| ✓ Faster and more memory efficient than sockets. |  ×	Slower and more memory-intensive than forking. |
| ✓️ Trivial to implement. | × Harder to implement. |
| ×	Only available for Unix-based systems like Linux and Mac (not Windows). | ✓ Works on every operating system (including Windows). |
| ×	Can cause problems when running through a GUI or IDE like RStudio.^[The reason is that shared GUI elements are being shared across child processes. (See the "GUI/embedded environments" section [here](https://stat.ethz.ch/R-manual/R-devel/library/parallel/html/mcfork.html).) To be fair, I've only ever run into a problem once or twice while running a forking process through RStudio. These have invariably involved very time-consuming functions that contain a bunch of nested while-loops. (I suspect the different worker processes began to move out of sync with one another.) However, I want you to be aware of it, so that you aren't caught by surprise if it ever happens to you. If it does, then the solution is simply to run your R script from the terminal using, say `$ Rscript myscript.R`.] | ✓ ️No risk of cross-contamination, since each process is run as a unique node. |


## Explicit vs implicit parallelization

Thus far we have only been concerned with *explicit* parallelization. As in, we explicitly told R to run a particular set of commands in parallel. But there is another form of *implicit* parallelization that is equally important to be aware of. In this case, certain low-level functions and operations are automatically run in parallel regardless of whether we told R to do so or not. Implicit parallelization can make a big difference to performance, but is not the default behaviour in R. So you have to enable it first. Moreover, combining explicit and implicit parallelization can cause problems if you don't take certain precautions. Let's take a look at where implicit parallelization enters the fray.

### BLAS/LAPACK

Did you ever wonder how R and other programming languages perform their calculations? For example, how does R actually do things like vector addition, or scalar and matrix multiplication? The answer is [**BLAS**](http://www.netlib.org/blas/) (**B**asic **L**inear **A**lgebra **S**uprograms). BLAS are a collection of low-level routines that provide standard building blocks for performing basic vector and matrix operations. These routines are then incoporated in related libraries like [**LAPACK**](http://www.netlib.org/lapack/) (**L**inear **A**lgebra **Pack**age), which provide their own routines for solving systems of linear equations and linear least squares, calculating eigenvalues, etc. In other words, BLAS and LAPACK provide the linear algebra framework that supports virtually all of statistical and computational programming 

R ships with its own BLAS/LAPACK libraries by default. These libraries place a premium on stablility (e.g. common user experience across operating systems). While the default works well enough, you can get *significant* speedups by switching to more optimized libraries such as the [Intel Math Kernel Library (MKL)](https://software.intel.com/en-us/mkl) or [OpenBLAS](https://www.openblas.net/). Among other things, these optimised BLAS libraries support multi-threading. So now you are using all your available computer power to, say, solve a matrix.

You can use the `sessionInfo()` command to see which BLAS/LAPACK library you are using. For example, I am using OpenBLAS on this computer:


```r
sessionInfo()[c("BLAS", "LAPACK")]
```

```
## $BLAS
## [1] "/usr/lib/libopenblas_haswellp-r0.3.8.so"
## 
## $LAPACK
## [1] "/usr/lib/libopenblas_haswellp-r0.3.8.so"
```

### Beware resource competition

While this all sounds great --- and I certainly recommend taking a look at MKL or OpenBLAS --- there is a potential downside. In particular, you risk competing with yourself for computational resources (i.e. memory) if you mix explicit and implicit parallel calls. For instance, if you run explicit multicore functions from within R on a system that has been configured with an optimised BLAS. As [Dirk Eddelbuettel](http://dirk.eddelbuettel.com/) succintly puts it in [this Stack Overflow thread](https://stackoverflow.com/a/18291826):

> There is one situation you want to avoid: (1) spreading a task over all _N_ cores and (2) having each core work on the task using something like OpenBLAS or MKL with all cores. Because now you have an _N_ by _N_ contention: each of the N task wants to farm its linear algebra work out to all _N_ cores.

Now, I want to emphasise that this conflict rarely matters in my own experience. I use optimised BLAS libraries and run explicit parallel calls all the time in my R scripts. Despite this, I have hardly ever run into a problem. Moreover, when these slowdowns have occured, I've found the effect to be relatively modest.^[The major cost appears to be the unnecessary duplication of objects in memory.] Still, I have read of cases where the effect can be quite dramatic (e.g. [here](https://stat.ethz.ch/pipermail/r-sig-hpc/2014-February/001846.html)) and so I wanted you to be aware of it all the same.

Luckily, there's also an easy and relatively costless solution: Simply turn off BLAS multi-threading. It turns out this has a negligible impact on performance, since most of the gains from optimised BLAS are actually coming from improved math vectorisation, not multi-threading. (See [this post](https://blog.revolutionanalytics.com/2015/10/edge-cases-in-using-the-intel-mkl-and-parallel-programming.html) for a detailed discussion.) You can turn off BLAS multi-threading for the current R session via the `RhpcBLASctl::blas_set_num_threads()` function. For example, I sometimes include the following line at the top of an R script:

```r
# blas_get_num_procs() ## If you want to find the existing number of BLAS threads
RhpcBLASctl::blas_set_num_threads(1) ## Set BLAS threads to 1 (i.e. turn off multithreading)
```

Since this is only in effect for the current R session, BLAS multithreading will be restored when I restart R.^[I could also reinstate the original behaviour in the same session by running `blas_set_num_threads(parallel::detectCores())`. You can turn off multithreading as the default mode by altering the configuration file when you first build/install your preferred BLAS library. However, that's both complicated and unecessarily restrictive in my view.] 

## Miscellaneous

### When should I go parallel?

The short answer is that you want to invoke the multicore option whenever you are faced with a so-called "[embarrassingly parallel](https://en.wikipedia.org/wiki/Embarrassingly_parallel)" problem. You can click on that link for a longer description, but the key idea is that these computational problems are easy to break up into smaller chunks. You likely have such a case if the potential code chunks are independent and do not need to communicate in any way. Classic examples include bootstrapping (since each regression or resampling iteration is drawn independently) and Markov chain Monte Carlo (i.e. [MCMC](https://en.wikipedia.org/wiki/Markov_chain_Monte_Carlo)).

Having said that, there are limitations to the gains that can be had from parallelization. Most obviously, there is the [computational overhead](https://en.wikipedia.org/wiki/Overhead_(computing)) associated with splitting up the problem, tracking the individual nodes, and then bringing everything back into a single result. This can be regarded as an issue largely affecting shorter and smaller computations. In other words, the overhead component of the problem tends to diminish in relative size as the overall computation time increases. 

On the opposite end of the spectrum, there is [Amdahl's law](https://en.wikipedia.org/wiki/Amdahl%27s_law) (generalised as [Gustafson's law](https://en.wikipedia.org/wiki/Gustafson%27s_law)). This formalises the intuitive idea that there are diminishing returns to parallelization, depending on the proportion of your code that can be run in parallel. A case in point is Bayesian MCMC routines, which typically include a fixed "burn-in" period regardless of how many parallel chains are being run in parallel.

![](12-parallel_files/figure-html/amdahl-1.png)<!-- -->

### How many cores should I use?

If you look this question up online, you'll find that most people recommend using `detectCores()-1`. This advice stems from the idea that you probably want to reserve one core for other tasks, such as running your web browser or word processor. While I don't disagree, I typically use all available cores for my parallel computations. For one thing, I do most of my heavy computational work in the cloud (i.e. on a server or virtual machine). So keeping some computational power in reserve doesn't make sense. Second, when I am working locally, I've gotten into the habit of closing all other applications while a parallel function is running. Your mileage may vary, though. (And remember the possible diminishing returns brought on by Amdahl's law).  FWIW, calling `plan(multiprocess)` automatically defaults to using all cores. You can change that by running, say, `plan(multiprocess(workers=detectCores()-1))`.

### Fault tolerance (error catching, caching, etc.)

In my experience, the worst thing about parallel computation is that it is very sensitive to failure in any one of its nodes. An especially frustrating example is the tendency of parallel functions to ignore/hide critical errors up until the very end when they are supposed to return output. ("Oh, so you encountered a critical error several hours ago, but just decided to continue for fun anyway? Thanks!") Luckily, all of the defensive programming tools that we practiced in the [previous lecture](https://raw.githack.com/uo-ec607/lectures/master/11-funcs-adv/11-funcs-adv.html) --- catching user errors and caching intermediate results --- carry over perfectly to their parallel equivalents. Just make sure that you use a persistent cache.

**Challenge:** Prove this to yourself by running a parallel version of the cached iteration that we practiced last time. Specifically, you should [recreate](https://raw.githack.com/uo-ec607/lectures/master/11-funcs-adv/11-funcs-adv.html#aside_1:_caching_across_r_sessions) the `mem_square_verbose()` function, which in turn relies on the `mem_square_persistent()` function.^[To clarify: The verbose option simply provides helpful real-time feedback to us. However, the underlying persistent cache location --- provided in this case by `mem_square_persistent()` --- is necessary whenever you want to use a memoised function in the futures framework.] You should then be able to run `future_map_dfr(1:10, mem_square_verbose)` and it will automatically return the previously cached results. After that, try `future_map_dfr(1:24, mem_square_verbose)` and see what happens.

### Random number generation

Random number generation (RNG) can become problematic in parallel computations (whether trying to ensure the same of different RNG across processes). R has various safeguards against this and future [automatically handles](https://www.jottr.org/2017/02/19/future-rng/) RNG via the `future.seed` argument. We saw an explicit example of this in example 2 [above](#1)_futureapply).

### Parallel regression

A number of regression packages in R are optimised to run in parallel. For example, the superb [**fixest**](https://github.com/lrberge/fixest/wiki) and [**lfe**](https://cran.r-project.org/web/packages/lfe/index.html) packages that we saw in the lecture on regression analysis will automatically invoke multicore capabilities when fitting high dimensional fixed effects models. The many Bayesian packages in R are also all capable of --- and, indeed, expected to --- fit regression models by running their MCMC chains in parallel (e.g. [**rStan**](https://cran.r-project.org/web/packages/rstan/vignettes/rstan.html#running-multiple-chains-in-parallel)). Finally, you may be interested in the [**partools**](https://cran.r-project.org/web/packages/partools/index.html) package, which provides convenient aliases for running a variety of statistical models and algorithms in parallel.

### CPUs vs GPUs

Graphical Processing Units, or GPUs, are specialised chipsets that were originaly built to perform the heavy lifting associated with rendering graphics. It's important to realise that not all computers have GPUs. Most laptops come with so-called [integrated graphics](https://www.laptopmag.com/articles/intel-hd-graphics-comparison), which basically means that the same processor is performing both regular and graphic-rendering tasks. However, gaming and other high-end laptops (and many desktop computers) include a dedicated GPU card. For example, the Dell Precision 5530 that I'm writing these lecture notes on has a [hybrid graphics](https://wiki.archlinux.org/index.php/hybrid_graphics) setup with two cards: 1) an integrated Intel GPU (UHD 630) and 2) a discrete NVIDIA Quadro P2000.

So why am I telling you this? Well, it turns out that GPUs also excel at non-graphic computation tasks. The same processing power needed to perform the millions of parallel calculations for rendering 3-D games or architectural software, can be put to use on scientific problems. How exactly this was discovered involves an interesting backstory of supercomputers being built with Playstations. (Google it.) But the short version is that modern GPUs comprise *thousands* of cores that can be run in parallel. Or, as my colleague [David Evans](http://econevans.com/) once memorably described it to me: "GPUs are basically just really, really good at doing linear algebra."

Still, that's about as much as I want to say about GPUs for now. Installing and maintaining a working GPU setup for scientific purposes is a much more complex task. (And, frankly, overkill for the vast majority of econometric or data science needs.) We may revisit the topic when we get to the machine learning section of the course in a few weeks.^[Advanced machine learning techniques like [deep learning](https://blog.rstudio.com/2018/09/12/getting-started-with-deep-learning-in-r/) are particularly performance-dependent on GPUs.] Thus, and while the general concepts carry over, everything that we've covered today is limited to CPUs.

### Monitoring multicore performance

Bash-compatible shells should come with the built-in `top` command, which provides a real-time view of running processes and resource consumption. (Pro-tip: Hit "1" to view processes across individual cores and "q" to quit.) An enhanced alternative that I really like and use all the time is [**htop**](https://hisham.hm/htop/), which is available on both Linux and Mac. (Windows users can install `htop` on the WSL that we covered way back in the [shell lecture](https://raw.githack.com/uo-ec607/lectures/master/03-shell/03-shell.html#windows).). It's entirely up to you whether you want to install it. Your operating system almost certainly provides built-in tools for monitoring processes and resource useage (e.g. [System Monitor](https://wiki.gnome.org/Apps/SystemMonitor)). However, I wanted to flag `htop` before we get to the big data section of the course. We'll all be connecting to remote Linux servers at that point and a shell-based (i.e. non-GUI) process monitor will prove very handy for tracking resource use.

## Further resources

- Dirk Eddelbuettel provides a comprehensive overview of all things R parallel in his new working paper, [*Parallel Computing With R: A Brief Review*](https://arxiv.org/abs/1912.11144). I'm confident that this will become the authoritative reference once it is published.
- Beyond Dirk's article, I'd argue that the starting point for further reading should be the future package vignettes ([one](https://cran.r-project.org/web/packages/future/vignettes/future-1-overview.html), [two](https://cran.r-project.org/web/packages/future/vignettes/future-2-output.html), [three](https://cran.r-project.org/web/packages/future/vignettes/future-3-topologies.html), [four](https://cran.r-project.org/web/packages/future/vignettes/future-4-issues.html), [five](https://cran.r-project.org/web/packages/future/vignettes/future-5-startup.html)). There's a lot in there, so feel free to pick and choose.
- Similarly, the [furrr package vignette](https://davisvaughan.github.io/furrr/index.html) is very informative (and concise).
- The [parallel package vignette](https://stat.ethz.ch/R-manual/R-devel/library/parallel/doc/parallel.pdf) provides a very good overview, not only its own purpose, but of parallel programming in general. Particular attention is paid to the steps needed to ensure a stable R environment (e.g. across operating systems).
- Finally, there a number of resources online that detail older parallel programming methods in R (`foreach`, `mclapply`, `parLapply` `snow`, etc.). While these methods have clearly been superseded by the future package ecosystem in my mind, there is still a lot of valuable information to be gleaned from understanding them. Two of my favourite resources in this regard are: [How-to go parallel in R](http://gforge.se/2015/02/how-to-go-parallel-in-r-basics-tips/) (Max Gordon) and [Beyond Single-Core R](https://github.com/ljdursi/beyond-single-core-R) (Jonathan Dursi).
