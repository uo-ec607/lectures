#-------------#
# Description #
#-------------#

# First, I generate a panel setting with diff-in-diff variation in happiness and
# treatment effect heterogeneity by income and initial poverty status.

# Second, I run a felm regression with threeway interactions.

# Finally, at the end of the script, I try to feed the marginal effects a felm object,
# yielding a "subscript out of bounds" error message.

#----------#
# Packages #
#----------#

library(tidyverse)
library(lfe)
library(broom)

#---------------#
# Generate Data #
#---------------#

set.seed(123) 

# number of observations
n <- 1000 # number of individuals
t <- 10 # number of time periods

# treament status
treat_period <- 6 # period of treatment
frac_treated <- 0.5 # fraction treated

# a few parameters
income_mean <- 50000
income_sd <- 25000
pov_line <- 0.3 # percent of mean income


data <- tibble(ind_id = rep(1:n, each = t),
               period = rep(1:t, n),
               treated = ifelse(ind_id <= n*frac_treated, 1, 0), # treatment group indicator (1 == "in treatment group")
               post = ifelse(period >= treat_period, 1, 0), # treatment date indicator (1 == "post intervention")
               treat_post = treated*post,
               income = rnorm(n*t, income_mean, income_sd),
               error = rnorm(n*t, 0, 1)) 

# create problematic variable name here (based on income in period 1)
d_tmp <- data %>% 
  filter(period == 1) %>% 
  select(ind_id, income) %>%  
  mutate(initial_income = as.factor(case_when(income <= pov_line*income_mean ~ "at or below poverty line",
                                              income >= pov_line*income_mean ~ "above poverty line")),
         poor = case_when(initial_income == "at or below poverty line" ~ 1, TRUE ~ 0)) %>% 
  select(-income)


data <- left_join(data, d_tmp, by = "ind_id")
rm(d_tmp)

# generate outcome variable
data <- data %>% 
  mutate(happiness = -1*treated - 2*post + 0.00004*income + 2*poor + 
           0.03*post*income + 0.05*poor*income + 0.5*treated*income +
           0.3*post*poor - 3*treated*poor + 2*treat_post +
           0.003*post*income*poor - 0.12*treated*income*poor +
           2*treat_post*poor - 0.02*treat_post*income + 0.7*treat_post*income*poor +
           error)

rm(n, t, treat_period, income_mean, income_sd)

#----------------------#
# Run Panel Regression # 
#----------------------#

# bad variable name: initial_income
reg1 <- felm(happiness ~ treat_post + treat_post:income + treat_post:initial_income + 
               treat_post:income:initial_income + income + initial_income:income + 
               post:income + post:initial_income:income + treated:income + treated:income:initial_income |
               initial_income:as.factor(period) + as.factor(ind_id):initial_income |
               0 |
               ind_id,
             data)

# solution: rename initial_income to poor
data$poor <- data$initial_income

reg2 <- felm(happiness ~ treat_post + treat_post:income + treat_post:poor + 
               treat_post:income:poor + income + poor:income + 
               post:income + post:poor:income + treated:income + treated:income:poor |
               poor:as.factor(period) + as.factor(ind_id):poor |
               0 |
               ind_id,
             data)

#-----------------------#
# felm Margins Function #
#-----------------------#

felm_marg_effects <-
  ## Computes the correct standard errors on the marginal effects of threeway
  ## interaction terms in a felm()-class panel regression.
  ## Args:
  ##    felm_model: A felm() object from the `lfe` package for linear model
  ##                high-dimensional fixed effects. See ?lfe::felm.
  ##    X1: The primary variable of interest. We are ultimately interested
  ##        in the marginal effect of X1 on some outcome variable (Y?),
  ##        conditional on the modifying variables X2 and D3. Expected to be
  ##        continuous.
  ##    X2: A second, modifying continuous variable.
  ##    D3: A third, modifying discrete variable. Expected to be a factor.
function(felm_model, X1, X2, D3, X2_level, conf_int=F) {
  
  ## Get the model call. Handy to know order of variables for later grep functions
  mod_call <- as.character(formula(felm_model))[2]
  ord <-
    sapply(c(X1, X2, D3), function(w) {
      gregexpr(pattern=w, mod_call)[[1]][1]
    })
  ## Factor levels (handy for later grep(l) functions)
  mod_coefs <- rownames(summary(felm_model)$coefficients)
  d3_levels <- mod_coefs[!grepl(":", mod_coefs)]
  d3_levels <- d3_levels[grep(D3, d3_levels)]
  
  ### Grab the coefficient standard errors ###
  se_vec <- summary(felm_model)$coefficients[,2]
  ## Main variable (X1)
  se_x1 <- se_vec[X1]
  ## Twoway interaction X1:X2
  se_x1x2 <- se_vec[grep(X1, names(se_vec))]
  se_x1x2 <- se_x1x2[grep(X2, names(se_x1x2))]
  se_x1x2 <- se_x1x2[!grepl(D3, names(se_x1x2))] ## remove threeway interaction
  ## Twoway interaction X1:D3
  se_x1d3 <- se_vec[grep(X1, names(se_vec))]
  se_x1d3 <- se_x1d3[grep(D3, names(se_x1d3))]
  se_x1d3 <- se_x1d3[!grepl(X2, names(se_x1d3))] ## remove threeway interaction
  ## Threeway interaction X1:X2:D3
  se_x1x2d3 <- se_vec[grep(X1, names(se_vec))]
  se_x1x2d3 <- se_x1x2d3[grep(X2, names(se_x1x2d3))]
  se_x1x2d3 <- se_x1x2d3[grep(D3, names(se_x1x2d3))]
  
  ## Get the appropriate variance-covariance matrix
  if(!is.null(felm_model$clustervcv)){
    vcov_mat <- felm_model$clustervcv
  } else if (!is.null(felm_model$robustvcv)) {
    vcov_mat <- felm_model$robustvcv
  } else if (!is.null(felm_model$vcv)){
    vcov_mat <- felm_model$vcv
  } else {
    stop("No vcv attached to felm object.")
  }
  
  ### Narrow down the relevant covariance combinations for the adjusted SEs ###
  ## Combination 1: cov(X1, X1:X2)
  cov_x1_x1x2 <- vcov_mat[grep(X2,rownames(vcov_mat)), grep(X1,colnames(vcov_mat))][,1]
  cov_x1_x1x2 <- cov_x1_x1x2[grep(X1, names(cov_x1_x1x2))]
  cov_x1_x1x2 <- cov_x1_x1x2[!grepl(D3, names(cov_x1_x1x2))]
  ## Combination 2: cov(X1, X1:D3)
  cov_x1_x1d3 <- vcov_mat[grep(D3,rownames(vcov_mat)), grep(X1,colnames(vcov_mat))][,1]
  cov_x1_x1d3 <- cov_x1_x1d3[grep(":", names(cov_x1_x1d3))]
  # cov_x1_x1d3 <- cov_x1_x1d3[grep(D3, names(cov_x1_x1d3))] ## Redundant with next step
  cov_x1_x1d3 <- cov_x1_x1d3[!grepl(X2, names(cov_x1_x1d3))]
  ## Combination 3a: cov(X1, X1:X2:D3)
  cov_x1_x1x2d3 <- vcov_mat[grep(":", rownames(vcov_mat)), grep(X1,colnames(vcov_mat))][,1]
  cov_x1_x1x2d3 <- cov_x1_x1x2d3[grep(X1, names(cov_x1_x1x2d3))]
  cov_x1_x1x2d3 <- cov_x1_x1x2d3[grep(X2, names(cov_x1_x1x2d3))]
  cov_x1_x1x2d3 <- cov_x1_x1x2d3[grep(D3, names(cov_x1_x1x2d3))]
  ## Combination 3b: cov(X1:X2, X1:D3)
  cov_x1x2_x1d3 <- vcov_mat[grep(D3,rownames(vcov_mat)), paste0(X1,":",X2)] ## Not robust to different ordering
  cov_x1x2_x1d3 <- cov_x1x2_x1d3[grep(":", names(cov_x1x2_x1d3))]
  cov_x1x2_x1d3 <- cov_x1x2_x1d3[!grepl(X2, names(cov_x1x2_x1d3))]
  ## Combination 3c: X1:X2 with X1:X2:D3
  cov_x1x2_x1x2d3 <- vcov_mat[, paste0(X1,":",X2)] ## Not robust to different ordering
  cov_x1x2_x1x2d3 <- cov_x1x2_x1x2d3[grep(X1, names(cov_x1x2_x1x2d3))]
  cov_x1x2_x1x2d3 <- cov_x1x2_x1x2d3[grep(X2, names(cov_x1x2_x1x2d3))]
  cov_x1x2_x1x2d3 <- cov_x1x2_x1x2d3[grep(D3, names(cov_x1x2_x1x2d3))]
  ## Combination 3d: X1:D3 with X1:X2:D3
  cov_x1d3_x1x2d3 <- vcov_mat[names(cov_x1x2_x1x2d3), names(cov_x1x2_x1d3)] ## Not robust to different ordering
  
  ### Compute the marginal effect SEs ###
  se_x1_x1x2BASE <- sqrt(se_x1**2 + se_x1x2**2*X2_level**2 + 2*cov_x1_x1x2*X2_level)
  # se_x1_x1d3 <- sqrt(se_x1**2 + se_x1d3**2 + 2*cov_x1_x1d3)
  names(se_x1_x1x2BASE) <- paste0(D3,"1:",names(cov_x1_x1x2)) ## Not robust to a change in order
  se_x1_x1x2d3 <-
    sapply(1:length(se_x1x2d3), function(i) {
      adj_se <-
        sqrt(
          ## Standard errors
          se_x1**2 +
            se_x1x2**2 * X2_level**2 +
            se_x1d3[i]**2 +
            se_x1x2d3[i]**2 * X2_level**2 +
            ## Covariances
            2 * cov_x1_x1x2 * X2_level +
            2 * cov_x1_x1d3[i] +
            2 * cov_x1_x1x2d3[i] * X2_level +
            2 * cov_x1x2_x1d3[i] * X2_level +
            2 * cov_x1x2_x1x2d3[i] * X2_level**2 + ## Note squared term
            2 * as.matrix(cov_x1d3_x1x2d3)[i,i] * X2_level
        )
      names(adj_se) <- names(se_x1x2d3)[i]
      return(adj_se)
    })
  
  std_errors <- c(se_x1_x1x2BASE, se_x1_x1x2d3)
  
  ## Get the marginal effects
  me_x1_x1x2BASE <-
    coef(felm_model)[X1] +
    X2_level*coef(felm_model)[names(cov_x1_x1x2)] ## CHANGED (January)
  names(me_x1_x1x2BASE) <- paste0(D3,"1:",names(cov_x1_x1x2)) ## Not robust to a change in order
  me_x1_x1x2d3 <-
    # coef(felm_model)[X1] +
    # X2_level*coef(felm_model)[names(cov_x1_x1x2)] +
    me_x1_x1x2BASE +
    coef(felm_model)[names(cov_x1_x1d3)] +
    X2_level*coef(felm_model)[names(cov_x1_x1x2d3)]
  names(me_x1_x1x2d3) <- names(cov_x1_x1x2d3)
  
  marg_effects <- c(me_x1_x1x2BASE, me_x1_x1x2d3)
  
  ## Finally, join together in an output data frame that is reminiscent of the
  ## broom::tidy() naming scheme.
  out <-
    data.frame(
      marg_effect=marg_effects,
      std_error=std_errors,
      V2 = X2_level,
      V3 = as.numeric(unlist(stringr::str_extract_all(names(marg_effects), "\\(?[0-9,.]+\\)?")))
    ) %>%
    as_data_frame()
  
  colnames(out) <- c("marg_effect", "std_error", X2, D3)
  
  if(conf_int==T){
    out <-
      out %>%
      mutate(
        conf_low = marg_effect - stats::qt(1-(1-.95)/2, felm_model$df.residual)*std_error,
        conf_high = marg_effect + stats::qt(1-(1-.95)/2, felm_model$df.residual)*std_error
      )
  }
  return(out)
} 